const pg = require("pg");
const express = require("express");
const app = express();
const client = new pg.Client('postgres://localhost/acme_hr_directory');
app.use(express.json())
app.use(require('morgan')('dev'))
const port = 6000;


app.get('/api/departments', async (req, res, next) => { 
    try {
        const SQL = `
        SELECT * from departments
      `
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (ex) {next(ex)}
});
app.get('/api/employees', async (req, res, next) => { 
    try {
        const SQL = `
      SELECT * from employees ORDER BY created_at DESC;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
    } catch (ex) {next(ex)}
});
app.post('/api/employees', async (req, res, next) => { 
    try {
        const SQL = `
        INSERT INTO employees(name, department_id)
        VALUES($1, $2)
        RETURNING *
      `
      const response = await client.query(SQL, [req.body.name, req.body.department_id])
      res.send(response.rows[0])
    } catch (ex) {next(ex)}
});
app.put('/api/employees/:id', async (req, res, next) => { 
    try {
    const SQL = `
      UPDATE employees
      SET name=$1, department_id=$3, updated_at= now()
      WHERE id=$4 RETURNING *
    `
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id
    ])
    res.send(response.rows[0])
    } catch (ex) {next(ex)}
});
app.delete('/api/employees/:id', async (req, res, next) => { 
    try {
    const SQL = `
      DELETE from employees
      WHERE id = $1
    `
    const response = await client.query(SQL, [req.params.id])
    res.sendStatus(204)
    } catch (ex) {next(ex)}
});



const init = async () => {
    await client.connect();
    console.log('connected to database');
    let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100)
    );
    CREATE TABLE employees(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      department_id INTEGER REFERENCES departments(id) NOT NULL
    );

    INSERT INTO departments(name) VALUES('Lab');
    INSERT INTO departments(name) VALUES('Medical Records');
    INSERT INTO departments(name) VALUES('ER');
    INSERT INTO employees(name, department_id) VALUES('Rico', (SELECT id FROM departments WHERE name='Lab'));
    INSERT INTO employees(name, department_id) VALUES('Jun', (SELECT id FROM departments WHERE name='Lab'));
    INSERT INTO employees(name, department_id) VALUES('Fatima', (SELECT id FROM departments WHERE name='Medical Records'));
    INSERT INTO employees(name, department_id) VALUES('Jen', (SELECT id FROM departments WHERE name='ER'));
    INSERT INTO employees(name, department_id) VALUES('Bill', (SELECT id FROM departments WHERE name='ER'));        
    `
    await client.query(SQL);
  }
  
  init();

  app.listen(port, () => console.log(`listening on port ${port}`))