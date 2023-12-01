//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-thong:Test123@cluster0.rzln4di.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log( 'Database Connected' ))
.catch(err => console.log( err ));

const itemsSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to the todolist"
});

const item2 = new Item({
  name: "Hit the button + to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}).then((foundItems) => {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(() => {
        console.log("Successfully to add default item");
      }).catch((err) => {
        console.log(err);
      });
      res.redirect("/");
    }
    res.render("list", {listTitle: "Today", newListItems: foundItems});

  }).catch((err) => {
    console.log(err);
  })

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");

  } else {
    List.findOne({name: listName}).then((foundList)=> {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    }).catch((err) => {
      console.log(err);
    })
  };

});

app.post("/delete", (req, res) => {
  console.log(req.body.checkbox);
  console.log("list name is: " + req.body.listName); //route
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete({_id: checkedItemId}).then(() => {
      console.log(`Successfully to delete item id: ${checkedItemId}`);
    }).catch((err) => {
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(() => {
      console.log(`Successfully to delete item id: ${checkedItemId} in list ${listName}`);
    }).catch((err) => {
      console.log(err);
    });
    res.redirect("/" + listName);
    
  }

});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName}).then((listFound) => {
    if (listFound) {
      console.log("Exist!");
      res.render("list", {listTitle: listFound.name, newListItems: listFound.items})
    } else {
      console.log("Doesn't exits!");
      const customList = new List({
        name: customListName,
        items: defaultItems
      });
      customList.save();
      res.redirect("/" + customListName);
    }
  }).catch((err) => {
    console.log(err);
  });
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
