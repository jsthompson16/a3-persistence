const express = require("express"),
    path = require("path"),
    http = require("http"),
    app = express(),
    port = (process.env.PORT || 3000),
    low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    session   = require( 'express-session' ),
    passport  = require( 'passport' ),
    Local     = require( 'passport-local' ).Strategy,
    bodyParser= require( 'body-parser' ),
    helmet = require('helmet'),
    morgan = require('morgan'),
    responseTime = require('response-time'),
    StatsD = require('node-statsd'),
    mime = require("mime");

const adapter = new FileSync('db.json');
const db = low( adapter );
const stats = new StatsD();
let currentUser = "";

db.defaults({ users: [], orders: [] }).write();

/*
for(let i = 0; i < db.get('orders').size().value(); i++) {
  const orderlocation = 'orders[' + i + ']';
  const order = db.get(orderlocation).value();
  if (order.createdinSession === true) {
    db.get(orderlocation)
        .assign({ createdinSession: false})
        .write();
  }
}

 */

app.use(express.static(path.join(__dirname + "/public")));
app.use(bodyParser.json());
app.use(helmet());
app.use(morgan('combined'));

stats.socket.on('error', function (error) {
  console.error(error.stack)
});

app.use(responseTime(function (req, res, time) {
  var stat = (req.method + req.url).toLowerCase()
      .replace(/[:.]/g, '')
      .replace(/\//g, '_');
  stats.timing(stat, time)
}));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.get("/img/:filename", function(req, res) {
  const filename = req.params["filename"];
  const extensionIndex = filename.lastIndexOf(".");
  const extension = filename.slice(extensionIndex, filename.length);

  res.header("Content-Type", mime.getType(extension));
  res.sendFile(path.join(__dirname + "/src/img/" + filename ));

  console.log("/img/" + filename);
});

app.get("/js/scripts.js", function(req, res) {
  res.sendFile(path.join(__dirname + "/js/scripts.js"));
});

app.get("/orders", function(req, res) {
  const state = db.getState();
  const str = JSON.stringify(state, null, 2);
  sendOrderData(res, str);
});

app.post("/submit", function(req, res) {
  let dataString = '';
  req.on( 'data', function( data ) {
    dataString += data
  });

  req.on( 'end', function() {
    const newOrder = JSON.parse(dataString);
    const orderPrice = calcPrice(newOrder.topping1, newOrder.topping2);

    const order = {
      'username': newOrder.username,
      'topping1': newOrder.topping1,
      'topping2': newOrder.topping2,
      'price': orderPrice,
      'id': db.get('orders').size().value() + 1,
      'createdBy': currentUser
    };

    db.get( 'orders' ).push(order).write();

    res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
    res.end();
  })
});

app.post("/update", function(req, res) {
  let dataString = '';
  req.on( 'data', function( data ) {
    dataString += data
  });

  req.on( 'end', function() {
    const updatedOrder = JSON.parse(dataString);
    const newPrice = calcPrice(updatedOrder.topping1, updatedOrder.topping2);
    db.get('orders')
        .find({ id: updatedOrder.id })
        .assign({ username: updatedOrder.username, topping1: updatedOrder.topping1,
                  topping2: updatedOrder.topping2, price: newPrice})
        .write();

    res.writeHead( 200, "OK", {'Content-Type': 'text/plain' });
    res.end();
  })
});

app.post("/delete", function(req, res) {
  let dataString = '';
  req.on( 'data', function( data ) {
    dataString += data
  });

  req.on( 'end', function() {
    const deleteThisOrder = JSON.parse(dataString);

    db.get('orders')
        .remove({ id: deleteThisOrder.id })
        .write();

    res.writeHead( 200, "OK", {'Content-Type': 'text/plain' });
    res.end();
  })
});

const myLocalStrategy = function(username, password, done) {
  const user = db.get('users').find({ username: username}).value();

  if (user === undefined) {
    const newUser = {
      'username': username,
      'password': password,
    };

    db.get( 'users' ).push(newUser).write();
    currentUser = username;
    return done( null, { username, password });
  }
  else if (user.password === password) {
    currentUser = username;
    return done( null, { username, password });
  }
  else {
    return done( null, false, { message: 'incorrect password'});
  }
};

passport.use( new Local( myLocalStrategy ) );

passport.serializeUser( (user, done) => done( null, user.username));

passport.deserializeUser( (username, done) => {
  const user = db.get('users').find({ username: username}).value();

  if ( user !== undefined) {
    done( null, user);
  }
  else {
    done( null, false, { message: 'user not found; session not restored'})
  }
});

app.use( session({ secret:'cats cats cats', resave:false, saveUninitialized:false }) );
app.use(passport.initialize());
app.use(passport.session());

app.post(
    '/login',
    passport.authenticate( 'local'),
    function( req, res ) {
      res.json({status: true})
    }
);

let server = http.createServer(app);
server.listen(port, function () {
  console.log("server started running");
});

const sendOrderData = function( response, orders ) {
  const type = mime.getType(orders);
  response.writeHead(200, { 'Content-Type': type });
  response.write(orders);
  response.end();
};

const calcPrice = function(topping1, topping2) {
  let price = 10;
  if (topping1 !== "")
    price += 2;
  if (topping2 !== "")
    price += 4;
  return price;
};
