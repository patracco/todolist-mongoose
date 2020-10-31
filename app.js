// jshint esversion:6

// ===> Here is where the defaults and declarations start <===
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
// 1. Install Mongoose with NPM then require the package.
const mongoose = require('mongoose');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 2. Create and connect to the Mongo database called todolistDB.
mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

// const items = ['Buy Food', 'Cook Food', 'Eat Food']
const workItems = [];

// 3. Create a mongoose Schema for every Collection.
const itemsSchema = {
  name: 'String'
};

// 4. Create a mongoose Model. We used a singular version of the collection name Items.
const Item = mongoose.model('Item', itemsSchema);

// 5. We created 3 new documents that will be the placeholders for the to-do list.
const item1 = new Item({
  name: 'Welcome to your to-do list'
});
const item2 = new Item({
  name: 'Hit the + button to add a new item'
});
const item3 = new Item({
  name: '<-- Hit this to delete an item'
});

// 6. We put the 3 default items into an array
const defaultItems = [item1, item2, item3];

// 15.2 We create a new schema for the new dynamic lists.
// Below we declare that for every new list that we create, the list is going to have a (list) name and an array of item documents associated with it.
const listSchema = {
  name: 'String',
  items: [itemsSchema]
};

// 16 We now need to create a new Mongoose model.
const List = mongoose.model('List', listSchema);

// 7. We store the array into the DB. NOTE: remember to comment out or you'll have duplicates.
// Item.insertMany(defaultItems, function(err) {
//   if (err) {
//     console.log('These is the problem: ' + err)
//   } else {'It worked'}
// })

// ===> Here is where the defaults and declarations end <===

// ===> Here is where the 'action' starts <===

// 8. We want to find the items in the DB and render them to the list web page. We use the Mongoose method FIND.
// <ModelName>.find({conditions}, function(err, results){
//  use the found results docs.
// })

// ===> app.get renders what is available in the BD <===
app.get('/', function (req, res) {
  // 11. We don't want to create duplicates. We added an IF statement to check if the foundItems array is empty.
  // Only if it's empty we want the app to add the 3 initial items. If foundItems is empty (.length === 0), then perform insertMany(), else render the list of items.
  // NOTE: we use .find instead of findOne because we want an array as a result (foundItems) instead of a single object. In fact, only woth an array we can perform foundItems.length.
  Item.find({}, function (err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log('These is the problem: ' + err);
        } else {
          console.log('It worked');
        }
      });
      // we need to add res.redirect here or the res.render below will never be reached.
      res.redirect('/');
    } else {
      res.render('list', {
        listTitle: 'Today',
        newListItems: foundItems // should also work with defaultItems instead.
      });
    }
  });
});

// We moved this inside the above ELSE statement.
// app.get('/', function(req, res) {
//   res.render('list', {listTitle: 'Today', newListItems: items})
// })

// 9. We added .name to <p><%=  newListItems[i].name  %></p> in list.ejs to replace the entire content of the array defaultItems
// with just their names.

// ===> app.post adds new items to the BD <===
app.post('/', function(req, res) {
  // 12. Add new items to the to-do list
  // 12.1 We specify that the every new item must take it's 'name:' from the field specified in the form on list.ejs, using req.body.newItem
  const itemName = req.body.newItem;

  // 12.2 then we declare that the new document/item created follows the Item model and it's name is itemName from the above const.
  const item = new Item({
    name: itemName
  });
  // 12.3 we specify that the new item has to be saved into the collection.
  item.save();

  // 12.4 we need to res.redirect('/') to display the newly added item or the page will keep loading until it fails.
  res.redirect('/');

  // We comment out the below code and replace with the above.
  // const item = req.body.newItem
  // if (req.body.list === 'Work') {
  //   workItems.push(item)
  //   res.redirect('/work')
  // } else {
  //   items.push(item)
  //   res.redirect('/')
  // }
});

// 13.3 Add new route '/delete' for the deleted/completed items
app.post('/delete', function(req, res) {
  // to log the value, use req.body
  // 14.1 We add .checkBox to req.body (checkBox is the checkbox input NAME in list.ejs).
  console.log(req.body.checkBox);

  // 14.3 We create a const that contains the checked item id.
  const checkedItemId = req.body.checkBox;

  // 14.4 We use Mongoose findByIdAndRemove() to remove the checked items from the DB.
  Item.findByIdAndRemove(checkedItemId, function(err) {
    // Handle any errors or log success. You must add the callback function(err), even if you don't care about errors, or it won't execute.
    if (!err) {
      console.log('Successfully deleted ' + req.body.checkBox);
    }
  });
  // 14.4 Again, we need to call a redirect.
  res.redirect('/');
});


// ===> app.get for new dynamic lists start <===
// 15. We added a new dynamic Express route that takes the parameter from whatever value the user wants to use (:customListName)
app.get('/:customListName', function(req, res) {
  // 15.1 We save req.params.customListName as a const.
  const customListName = req.params.customListName;

  // 18. Check if the list name already exists, so we don't create duplicated lists with the same name.
  // NOTE: in this case we use .findOne instead of find (like above in point 11) because this time we want a
  // single object as a result (foundList) instead of an array (from point 11: foundItems).
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    // if there's no error...
    if (!err) {
      // if foundList (the name of the list, the term used after the '/' in localhost:3000/) does not exists yet...
      if (!foundList) {
        console.log('No such list found');
        // Here we create the new list
        // 17. Now we're ready to create new list documents based of the new List model.
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        // 17.1 We need to save the list into the List collection.
        list.save();
        // 19. We need to res.redirect or the page will keep loading
        res.redirect('/' + customListName);
      } else {
        console.log('List already exists');
        // 18.1 Here we show an existing list. As point 11, we use res.render. However, this time we have a dynamic listTitle, which is customListName.name.
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

// ===> app.get for new dynamic lists end <===

app.get('/about', function(req, res) {
res.render('about');
});

// ===> Here is where the 'action' ends <===

app.listen(3000, function () {
  console.log('Server started on port 3000');
});
