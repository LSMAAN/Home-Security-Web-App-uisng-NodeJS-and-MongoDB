const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const MongoDBStore = require('connect-mongodb-session')(session);
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');




const app = express();

//Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

//DB URI
//for offline
const mongoURI = "mongodb://localhost:27017/Safe2";

//for online
//const mongoURI = "mongodb+srv://Admin:Admin@cluster0.e5ad2.mongodb.net/Final?retryWrites=true&w=majority";

//Crete connection
mongoose.connect(mongoURI,{
    useNewUrlParser: true,
    //useCreateIndex: true,
    useUnifiedTopology: true,
    //useFindAndModify: false
    //useCreateIndex: true
}).then(() => {
    console.log("Connected successfully");
}).catch((err) => console.log(err));

const store = new MongoDBStore({
    uri: mongoURI,
    collection: 'mySessions',
});


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
    fname :{
        type: String,
        required:true
        //unique:true
    },
    lname :{
        type: String,
        required:true
        //unique:true
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
    fname :{
        type: String,
        required:true
        //unique:true
    },
    lname :{
        type: String,
        required:true
        //unique:true
    },
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

//sessions
app.use(
    session({
        secret: "Secret",
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);

const isAuth = (req, res, next) =>{
    if(req.session.isAuth){
        next();
    }
    else{
        res.render("loginUser");
    }
}
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
                    email: req.body.email,
                    fname: req.body.fname,
                    lname: req.body.lname
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
        res.status(400).send("Already have one admin");
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
            let alert = require('alert');
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
    res.render("loginUser");
});



app.post("/registerUser", async(req,res) =>{
    const {password} = req.body;
    try{
        const hashPas = await bcrypt.hash(password,12);
        const regUser = new registerUser({
            fname: req.body.fname,
            lname: req.body.lname,
            password: hashPas,
            email: req.body.email,
            username: req.body.username
        })
        const registered = await regUser.save();
        res.status(201).render("loginUser");
    }
    catch(error){
        res.status(400).send(error);
    }
})

app.get("/loginUser", function (req, res) {
    res.render("loginUser");
});


app.post("/UserDashboard", async(req,res) =>{
    try {
        const username = req.body.username;
        const password = req.body.password;

        const userpass = await registerUser.findOne({username:username});
        const uname = await registerUser.findOne({username:username});

        const isMatch = await bcrypt.compare(password,userpass.password);

        /*
        if(userpass.password === password){
            registerUser.find({},function(err,docs){
                res.render("Userdashboard",{name:username});
            });
            
        }
        */
        if(isMatch){
            registerUser.find({},function(err,docs){

                req.session.isAuth = true;
            
                res.render("Userdashboard",{username:username});
            });
            
        }
        else{
            alert("username or password incorrect");
        }
    } catch (error) {
        //res.status(400).send("invalid username or password");
        res.status(400).send(error);
    }
    //console.log(req.body);
});

app.post("/delete", function(req,res){
    const clickItem = req.body.BTN;

    registerUser.findByIdAndDelete(clickItem, function(err){
        if(!err){
            console.log("Successfully deleted");
            res.render("loginAdmin");
        }
    });
    console.log(req.body);
});

app.post("/deleteuser", function(req,res){
    const clickItem = req.body.BTN;
    console.log(clickItem);
    
    registerUser.findOneAndDelete({username:clickItem}, function(err){
        if(!err){
            console.log("Successfully deleted");
            res.render("index");
        }
    });
    
    
    
    console.log(req.body);
});

/*
app.post("/deleteuser", function(req,res){
    const clickItem = req.body.BTN;

    registerUser.findByIdAndDelete(clickItem, function(err){
        if(!err){
            console.log("Successfully deleted");
            res.redirect("index");
        }
    });
    console.log(req.body);
});
*/

//Admin Dashboard
/*
app.get("/Admindashboard",function(req,res){

});
*/


//User dashboard
app.get("/Userdashboard",isAuth, function(req,res){
    
});

//logout
app.post("/logout", function(req, res) {
    req.session.destroy(function(err){
        if(err) throw err;
        res.redirect("/");
    });
});



/*
registerUser.find({},function(err, docs){
    for(let i = 0; i < docs.length; i++){
        console.log(docs[i].username);
    }
    //console.log(docs._id);
}
);
*/
app.get("/vid", function (req, res) {
    res.render("vid");
});
app.get("/vid1", function (req, res) {
    res.render("vid1");
});
app.get("/vid2", function (req, res) {
    res.render("vid2");
});
app.get("/vid3", function (req, res) {
    res.render("vid3");
});
app.get("/vid4", function (req, res) {
    res.render("vid4");
});

app.get("/cam", function (req, res) {
    res.render("cam");
});

app.get("/sensor", function (req, res) {
    res.render("sensor");
});

app.get("/bura", function (req, res) {
    res.render("bura");
});




//const port = process.env.PORT || 3000;
let port = process.env.PORT;
if(port == null || port == ""){
    port = 8000;
}
app.listen(port, function () {
    console.log("Server Has Started!");
});
