const express = require("express"),
    path = require("path"),
    http = require("http"),
    app = express(),
    port = (process.env.PORT || 3000),
    mime = require("mime");

const appdata = [
  { 'username': 'Jarod Thompson', 'topping1': 'Pepperoni', 'topping2': 'Bacon', 'price': 17 },
  { 'username': 'Tom Gibbia', 'topping1': 'Sausage', 'topping2': 'Green Pepper', 'price': 15 },
  { 'username': 'Patty Alzaibak', 'topping1': 'Pepperoni', 'topping2': 'Garlic', 'price': 14 }
];

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
  sendOrderData(res, appdata);
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
      'price': orderPrice
    };

    appdata.push(order);

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
    const oldOrder = JSON.parse(dataString);
    const newPrice = calcPrice(oldOrder.topping1, oldOrder.topping2);

    const updatedOrder = {
      'username': oldOrder.username,
      'topping1': oldOrder.topping1,
      'topping2': oldOrder.topping2,
      'price': newPrice
    };

    appdata.splice(oldOrder.index, 1, updatedOrder);

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
    appdata.splice(deleteThisOrder.orderNum, 1);

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
  response.write(JSON.stringify({ data: orders }));
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
