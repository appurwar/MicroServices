var express = require('express')
var app = express()

var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : "aagm9e2du3rm1z.cyi40ipdvtjm.us-east-1.rds.amazonaws.com",
  user     : "microservices",
  password : "microservices",
  port     : 3306,
  database : "microservices"
});

connection.connect(function(err) {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    connection.end();
    return;
  }

  console.log('You are connected');


  app.get('/', function (req, res) {
    res.send('Hello World - running on Express!')
  })

  app.get('/address', function (req, res) {
    connection.query("SELECT * from Address", function (err, rows) {
      res.json(rows);
    })
  });

  app.post('/address', function (req, res) {
    //Need to test this out, postman or something?
    connection.query("INSERT INTO Address VALUES (?, ?, ?, ?)", req.params.street, req.params.city, req.params.state, req.params.zipcode, function (err, rows) {
      res.send('Post call on the Address!');
    })
  });

  app.get('/address/:id', function(req, res) {
    connection.query("SELECT * from Address WHERE uuid=?", req.params.id, function (err, rows) {
      if (rows[0]) {
        res.json(rows[0]);
      } else {
        res.send("Invalid id!");
      }
    })
  });

  app.put('/address/:id', function(req, res) {
    res.send('Put on Address - ' + req.params.id);
  });

  app.delete('/address/:id', function(req, res) {
    //Need to test this out, postman or something?
    connection.query("DELETE FROM Address WHERE uuid=?", req.params.id, function (err, rows) {
      res.send('Delete on Address - ' + req.params.id);
    })
  });

  app.listen(8000, function () {
    console.log('Address app listening on port 8000!');
  });


});
