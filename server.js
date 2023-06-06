const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(cors())

const db = require('knex')({
    client: 'pg',
    connection: process.env.DATABASE_URL,
    searchPath: ['knex', 'public'],
  });


app.post( '/signin' ,async(req,res) =>{
    const { email , password} = req.body
    try{
        const LoginUser = await db.select('hash' , 'email')
        .from('login')
        .where({
            email
        })
        const CheckPassword = await bcrypt.compare(password, LoginUser[0].hash);
        if(CheckPassword){
            const user = await db.select('*')
            .from('users')
            .where({
                email
            })
            return res.json(user[0]);
        }else return res.status(400).json('unable to signin')
        
    }catch(error){
        return res.status(400).json('unable to signin')
    }
})

app.post( '/signup' ,async(req,res) =>{
    const { name , email , password , confirmpassword} = req.body
    if(password !== confirmpassword ) return res.status(404).json('unable to signup')
    try{
        const hash = await bcrypt.hash(password, saltRounds);
        await db.transaction(async(trx) => {
            const LoginEmail = await trx('login')
            .insert({
                hash ,
                email
            }).returning('email')
            const user = await trx('users')
            .insert({
                name ,
                email : LoginEmail[0].email ,
                joined : new Date()
            }).returning('*')
            return res.json(user[0])
        })
    }catch(error){
        return res.status(400).json('unable to register')
    }
})

app.get('/men/:category',async(req,res)=>{
    try {
        const { category } = req.params
        const products = await db.select('id' , 'name' , 'price' ,'category' , 'image').from('products').where({
            gender : 'men',
            category
        })
        return res.send(products)
    } catch (error) {
        return res.status(400).json('Refresh')
    }
    
})
app.get('/women/:category',async(req,res)=>{
    try {
        const { category } = req.params
        const products = await db.select('id' , 'name' , 'price' ,'category' , 'image').from('products').where({
            gender : 'women',
            category
        })
        return res.send(products)
    } catch (error) {
        return res.status(400).json('Refresh')
    }
    
})
app.get('/kids/:category',async(req,res)=>{
    try {
        const { category } = req.params
        const products = await db.select('id' , 'name' , 'price' ,'category' , 'image').from('products').where({
            gender : 'kids',
            category
        })
        return res.send(products)
    } catch (error) {
        return res.status(400).json('Refresh')
    }
    
})

app.get('/',(req,res)=> res.json("It's work"));


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
