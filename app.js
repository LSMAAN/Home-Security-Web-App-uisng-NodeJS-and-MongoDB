const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');


const app = express();

//Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

//DB URI
//const mongoURI = "mongodb://localhost:27017/testCam";

const mongoURI = "mongodb+srv://Admin:Admin@cluster0.e5ad2.mongodb.net/testCam?retryWrites=true&w=majority";

//Crete connection
mongoose.connect(mongoURI,{
    useNewUrlParser: true,
    //useCreateIndex: true,
    //useUnifiedTopology: true,
   //useFindAndModify: false
    //useCreateIndex: true
}).then(() => {
    console.log("Connected successfully");
}).catch((err) => console.log(err));

const users = [];

//Admin Schema

var adminSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
    password: {
        type:String,
        min:5,
        max: 15,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    }

})

//Admin Collection
const registerAdmin = mongoose.model("registerAdmin",adminSchema);

//User Schema
var userSchema = new mongoose.Schema({
    username :{
        type: String,
        required:true,
        unique:true
    },
    password:{
        type: String,
        required:true
    },

    email:{
        type: String,
        required:true,
        unique:true
    }
    

})

//User Collection
const registerUser = mongoose.model("registerUser", userSchema);

app.get("/", (req, res) =>{
    res.render("index");
});


//Admin form
app.get("/Admin", function (req, res) {
    res.render("Admin");
});

app.get("/registerAdmin", function (req, res) {
    res.render("registerAdmin");
});



app.post("/registerAdmin", (req,res) =>{
    try{
        registerAdmin.count(function (err, count) {
            if (!err && count === 0) {
                const regAdmin = new registerAdmin({
                    username: req.body.username,
                    password: req.body.password,
                    email: req.body.email
                })
                const registered = regAdmin.save();
                res.status(201).render("index"); 
            }
            else{
                console.log("Already have one admin");
            }
        });
        
    }
    catch(error){
        res.status(400).send(error);
    }
})

app.get("/loginAdmin", function (req, res) {
    res.render("loginAdmin");
});

app.post("/loginAdmin", async(req,res) =>{
    try {
        const username = req.body.username;
        const password = req.body.password;

        const userpass = await registerAdmin.findOne({username:username});

        if(userpass.password === password){
            registerUser.find({},function(err,docs){
                res.status(201).render("Admindashboard",{docs:docs});
            });
            
        }
        else{
            alert("username or password incorrect");
        }
    } catch (error) {
        res.status(400).send("invalid username");
    }
})

// Showing User form 
app.get("/User", function (req, res) {
    res.render("User");
});

app.get("/registerUser", function (req, res) {
    res.render("registerUser");
});



app.post("/registerUser", async(req,res) =>{
    try{
        const regUser = new registerUser({
            username: req.body.username,
            password: req.body.password,
            email: req.body.email
        })
        const registered = await regUser.save();
        res.status(201).render("index");
    }
    catch(error){
        res.status(400).send(error);
    }
})

app.get("/loginUser", function (req, res) {
    res.render("loginUser");
});

app.post("/loginUser", async(req,res) =>{
    try {
        const username = req.body.username;
        const password = req.body.password;

        const userpass = await registerUser.findOne({username:username});

        if(userpass.password === password){
            registerUser.find({},function(err,docs){
                res.render("Userdashboard",{name:username});
            });
            
        }
        else{
            alert("username or password incorrect");
        }
    } catch (error) {
        res.status(400).send("invalid username or password");
    }
    //console.log(req.body);
});

app.post("/delete", function(req,res){
    const clickItem = req.body.BTN;

    registerUser.findByIdAndDelete(clickItem, function(err){
        if(!err){
            console.log("Successfully deleted");
            res.redirect("Admindashboard");
        }
    });
    //console.log(req.body);
});

//Admin Dashboard
/*
app.get("/Admindashboard",function(req,res){

});
*/

/*
//User dashboard
app.get("/Userdashboard",function(req,res){
    
});
*/


/*
registerUser.find({},function(err, docs){
    for(let i = 0; i < docs.length; i++){
        console.log(docs[i].username);
    }
    //console.log(docs._id);
}
);
*/




//const port = process.env.PORT || 3000;
let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}
app.listen(port, function () {
    console.log("Server Has Started!");
});
