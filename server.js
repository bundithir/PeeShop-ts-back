const express = require('express')
const cors = require('cors')
const stripe = require('stripe')(process.env.VITE_STRIPE_SECRET_KEY)
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


app.post('/create-payment-intent', async(req , res) => {
    try {
        const { amount } = req.body
        const paymentIntent = await stripe.paymentIntents.create({
            amount ,
            currency : 'thb',
            automatic_payment_methods: {
                enabled: true,
            }
        })
        res.send({clientSecret: paymentIntent.client_secret});
    }catch(error){
        console.log(error)
        res.status(400).json('cannot')
    }
})

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
            try {
                const LoginEmail = await trx('login')
                .insert({
                    hash ,
                    email
                }).returning('email')
                const user = await trx('users')
                .insert({
                    name ,
                    email : LoginEmail[0].email ,
                    joined : new Date() ,
                    status : "customer"
                }).returning('*')
                await trx.commit()
                return res.json(user[0])
            } catch (error) {
                await trx.rollback();
                return res.status(400).json('unable to register')
            }
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
        }).orderBy('id','desc')
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
        }).orderBy('id','desc')
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
        }).orderBy('id','desc')
        return res.send(products)
    } catch (error) {
        return res.status(400).json('Refresh')
    }
    
})

app.get('/products',async(req,res)=> {
    try{
        const products = await db.select('*').from('products').orderBy('id','desc')
        return res.send(products)
    }catch (error) {
        return res.status(400).json('Cannot Fetch Products')
    }
})

app.delete('/delproduct' ,async(req , res) => {
    const { id } = req.body
    await db.transaction(async(trx)=> {
        try {
            await trx('products').whereIn('id' , id).del()
            const products = await trx.select('*').from('products').orderBy('id','desc')
            await trx.commit()
            return res.send(products)
        } catch (error) {
            await trx.rollback()
            return res.status(400).json('Cannot Delete')
        }
    })

})


app.put('/updateproduct' , async(req ,res) => {
    const { id , name , price , gender , category , image } = req.body
    await db.transaction(async(trx)=> {
        try {
            await trx('products').where({id}).update({
                name ,
                price ,
                gender,
                category ,
                image
            })
            const products = await trx.select('*').from('products').orderBy('id','desc')
            await trx.commit()
            return res.send(products)
        } catch (error) {
            await trx.rollback()
            return res.status(400).json('Cannot Update')
        }
    })
})

app.post('/addproduct' , async(req,res) => {
    const { name , price , gender , category , image } = req.body
    await db.transaction(async(trx)=>{
        try {
            await trx('products').insert({
                name , 
                price ,
                gender ,
                category ,
                image
            })
            const products = await trx.select('*').from('products').orderBy('id','desc')
            await trx.commit()
            return res.send(products)
        } catch (error) {
            await trx.rollback()
            return res.status(400).json('Cannot add')
        }
    })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
