var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
var request = require('request');



var connection = mysql.createConnection({
  host     : "aa18rny5pdr87g5.cyi40ipdvtjm.us-east-1.rds.amazonaws.com",
  user     : "microservices",
  password : "microservices",
  port     : 3306,
  database : "microservices"
});

app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
	console.log('here');
	next();
 });

app.use(bodyParser());

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

  app.get('/person', function (req, res) {
    console.log('get person called')
    let firstname = "and firstname = '"+req.query.firstname+"'";
    let lastname = "and lastname = '"+req.query.lastname+"'";
    let age = "and age = "+req.query.age;
    let phone = "and phone = '"+req.query.phone;
    connection.query("SELECT * from Person where 1=1 "+((req.query.firstname === undefined) ? '' : firstname)+ " "+((req.query.lastname === undefined) ? '' : lastname)+ " "+((req.query.age === undefined) ? '' : age)+ " "+((req.query.phone === undefined) ? '' : phone), function (err, rows) {
        request('http://Address-env.uitihrdzi7.us-east-1.elasticbeanstalk.com:8000/address', function (error, response, body) {
          if (error) {
            console.log(error);
          }
          if (response.statusCode === 200) {
          console.log(body)
          body = JSON.parse(body);
          for (row in rows) {
            for (address in body) {
              if (body[address].uuid==rows[row].addressUuid) {
                console.log(address);
                rows[row]["address"] = body[address].street + ", " + body[address].city + ", " + body[address].state + " " + body[address].zipcode;
          rows[row].addressLink = {
                  href: 'http://Address-env.uitihrdzi7.us-east-1.elasticbeanstalk.com:8000/address/'+ rows[row]["addressUuid"]
                }
                delete rows[row]["addressUuid"];
              }
              console.log("qwrq")
            }
        rows[row].self = {
          href: 'http://person-env.n924wyqpyp.us-east-1.elasticbeanstalk.com:8000/person/' + rows[row]['id']
          }
          }
            console.log(rows)
            res.json(rows);
          } else {
            console.log(error);
            console.log(response);
            console.log(response.statusCode);
            console.log(body);
          }
          });
      })
    });

  app.get('/person/page/:offset', function (req, res) {
    connection.query("SELECT ROUND(a.totalPages/5,0) as totalPages, Person.* from (select count(*) as totalPages from Person) as a, Person LIMIT "+(req.params.offset*5)+", 5",  function (err, rows) {
      request('http://Address-env.uitihrdzi7.us-east-1.elasticbeanstalk.com:8000/address', function (error, response, body) {
        if (response.statusCode === 200) {
        console.log(body)
        body = JSON.parse(body);
        for (row in rows) {
          for (address in body) {
            if (body[address].uuid==rows[row].addressUuid) {
              console.log(address);
              rows[row]["address"] = body[address].street + ", " + body[address].city + ", " + body[address].state + " " + body[address].zipcode;
			  rows[row].addressLink = {
				href: 'http://Address-env.uitihrdzi7.us-east-1.elasticbeanstalk.com:8000/address/'+ rows[row]["addressUuid"]
			  }
			  delete rows[row]["addressUuid"];
            }
          }
		  rows[row].self = {
 				href: 'http://person-env.n924wyqpyp.us-east-1.elasticbeanstalk.com:8000/person/' + rows[row]['id']
 			  }
        }
          console.log(rows)
          res.json(rows);
        }
        });
    })
  });

  app.post('/person', function (req, res) {
    //Need to test this out, postman or something?
    console.log(req.body)
//INSERT INTO Person (firstname, lastname, age, phone, addressUuid) VALUES ('Barney', 'Barns', '88', '(123) 456-7901', '5bcaa9bd-e315-427d-93cf-2d027cc1b6e2');
    connection.query("INSERT INTO Person (firstname, lastname, age, phone, addressUuid) VALUES (?, ?, ?, ?, ?)", [req.body.firstname, req.body.lastname, req.body.age, req.body.phone, req.body.addressUuid], function (err, rows) {
    res.send('Post call on the Person!');
    })
  });

  app.get('/person/:id', function(req, res) {
    connection.query("SELECT * from Person WHERE id=?", req.params.id, function (err, rows) {
      if (rows[0]) {
        request('http://Address-env.uitihrdzi7.us-east-1.elasticbeanstalk.com:8000/address/' + rows[0].addressUuid, function (error, response, body) {
          if (body=="Invalid id!") {
            rows[0].self = {
              href: 'http://person-env.n924wyqpyp.us-east-1.elasticbeanstalk.com:8000/person/' + rows[0]['id']
            }
            res.json(rows[0]);
            return;
          }
          console.log('error:', error);
          console.log('statusCode:', response && response.statusCode);
          console.log('body:', body);
          body = JSON.parse(body);
          rows[0]["address"] = body['street'] + ", " + body['city'] + ", " + body['state'] + " " + body['zipcode'];
		  rows[0].addressLink = {
                href: 'http://Address-env.uitihrdzi7.us-east-1.elasticbeanstalk.com:8000/address/'+ rows[0]["addressUuid"]
              }
		  rows[0].self = {
 				href: 'http://person-env.n924wyqpyp.us-east-1.elasticbeanstalk.com:8000/person/' + rows[0]['id']
 			  }
          delete rows[0]["addressUuid"];
          res.json(rows[0]);
        });
      } else {
        res.send("Invalid id!");
      }
    })
  });

  app.put('/person/:id', function(req, res) {
    console.log(req);
    connection.query("UPDATE Person SET firstname=?, lastname=?, age=?, phone=?, addressUuid=? WHERE id=?", [req.body.firstname, req.body.lastname, req.body.age, req.body.phone, req.body.addressUuid, req.params.id], function (err, rows) {
    res.send('Put on Person - ' + req.params.id);
    })
  });

  app.delete('/person/:id', function(req, res) {
    //Need to test this out, postman or something?
    connection.query("DELETE FROM Person WHERE id=?", req.params.id, function (err, rows) { 
      res.send('Delete on Person - ' + req.params.id);
    })
  });

//Function to fetch the address of a person using ID
 app.get('/person/:id/address', function (req, res) {
   connection.query("SELECT addressUuid from Person where id=?", req.params.id, function (err, rows) {
     if (rows[0]) {
         console.log('http://Address-env.uitihrdzi7.us-east-1.elasticbeanstalk.com:8000/address/'+rows[0].addressUuid);
         request('http://Address-env.uitihrdzi7.us-east-1.elasticbeanstalk.com:8000/address/'+rows[0].addressUuid, function (error, response, body) {
         console.log('error:', error); // Print the error if one occurred
         console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
         console.log('body:', body); // Print the HTML for the Google homepage.
         res.json(JSON.parse(body));
     })} else {
       res.send("Invalid id!");
     }
   })
});

  app.listen(8000, function () {
    console.log('Person app listening on port 8000!');
  });


});
