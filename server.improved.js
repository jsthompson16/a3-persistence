const express = require("express"),
    path = require("path"),
    http = require("http"),
    app = express(),
    port = (process.env.PORT || 3000),
    low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    mime = require("mime");

const adapter = new FileSync('db.json');
const db = low( adapter );

db.defaults({ users:[] }).write();

app.use(express.static(path.join(__dirname + "/public")));

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
  console.log("Scripts have been loaded");
});

app.get("/orders", function(req, res) {
  const state = db.getState();
  const str = JSON.stringify(state, null, 2);
  sendOrderData(res, str);
  console.log("Orders have been loaded");
});

app.post("/submit", function(req, res) {
  console.log("Started to submit new request");
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
      'id': db.get('users').size().value() + 1
    };

    db.get( 'users' ).push(order).write();

    res.writeHead(200, "OK", {'Content-Type': 'text/plain'});
    res.end();
  })
});

app.post("/update", function(req, res) {
  console.log("Started to update request");
  let dataString = '';
  req.on( 'data', function( data ) {
    dataString += data
  });

  req.on( 'end', function() {
    const updatedOrder = JSON.parse(dataString);
    const newPrice = calcPrice(updatedOrder.topping1, updatedOrder.topping2);
    console.log(updatedOrder);
    db.get('users')
        .find({ id: updatedOrder.id })
        .assign({ username: updatedOrder.username, topping1: updatedOrder.topping1,
                  topping2: updatedOrder.topping2, price: newPrice})
        .write();

    res.writeHead( 200, "OK", {'Content-Type': 'text/plain' });
    res.end();
  })
});

app.post("/delete", function(req, res) {
  console.log("Started to delete request");
  let dataString = '';
  req.on( 'data', function( data ) {
    dataString += data
  });

  req.on( 'end', function() {
    const deleteThisOrder = JSON.parse(dataString);

    db.get('users')
        .remove({ id: deleteThisOrder.id })
        .write();

    res.writeHead( 200, "OK", {'Content-Type': 'text/plain' });
    res.end();
  })
});

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
