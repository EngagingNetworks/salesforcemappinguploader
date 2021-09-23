// https://localhost:3000

require('dotenv').config() // get environmental variables

const express = require('express')
const session = require('express-session')
const mustacheExpress = require('mustache-express')
const fs = require('fs')
const https = require('https')
const path = require('path')
const bodyParser = require('body-parser')
const utils = require('./utils')

// api
const rest = require('./rest')

// oauth2
const passport = require('passport')
const OAuth2SalesforceStrategy = require('passport-salesforce-oauth2')


const tokens = {}

passport.use(new OAuth2SalesforceStrategy(
	{
		clientID: process.env.CLIENTID,
		clientSecret: process.env.CLIENTSECRET,
		callbackURL: process.env.CALLBACKURL
	},
	(accessToken, refreshToken, profile, done) => {

		console.log('Got access token', accessToken)

		tokens[profile.id] = accessToken

		done(null, profile)

	}
));


// create app

const start = async function(){

	const app = express()
	app.engine('mustache', mustacheExpress(__dirname + '/views/partials', '.mst'))
	app.set('view engine', 'mustache')
	app.set('views', __dirname + '/views')

	//defaults
	app.use(bodyParser.json())
	app.use(express.static('public'))


	// session handling
	app.use(session({
		secret: 'You are a wizard, Harry',
		resave: false,
		saveUninitialized: true
	}))


	// authorisation
	app.use(passport.initialize())
	app.use(passport.session())

	passport.serializeUser(function(user, cb) {

		cb(null, user.id)

	})

	passport.deserializeUser(function(obj, cb) {

		cb(null, {
			id: obj,
			sessionToken: tokens[obj]
		})

	})

	const checkAuthorised = function(req, res, next){

		if(req.user && req.user.id && tokens[req.user.id]){
			return next()
		}else{
			res.redirect('/login') 
		}

	}


	// routes
	app.get(
		'/',
		function (req, res) {

			res.render('start')
			
		}
	)

	app.get(
		'/login',
		passport.authenticate('salesforce', { failureRedirect: '/error' })
	)

	app.get(
		'/loggedin',
		passport.authenticate('salesforce', { failureRedirect: '/login' }),
		function(req, res){

			res.redirect('/list')

		}
	)

	app.get(
		'/error',
		function (req, res) {

			res.sendFile(path.join(__dirname + '/public/error.html'));

		}
	)


	app.get(
		'/list',
		checkAuthorised,
		async function (req, res) {

			try {

				let data = await rest.sfQuery(
					req.user.sessionToken,
					'SELECT Name, Id from Mapping_Rule__c LIMIT 100'
				)

				const records = data && data.records ? data.records : []

				let dataFiles = await utils.getAllDataFiles()

				res.render('mappings', {
					token: req.user.sessionToken,
					currentMappings: records,
					dataFiles
				})

			}

			catch(err){
				throw new Error('Unable to retrieve list: ' + err)
			}

		}
	)


	app.get(
		'/upload',
		checkAuthorised,
		async function (req, res) {

			const renderOptions = await utils.uploadFile(req.user.sessionToken, req.query.file)
			res.render('uploaded', renderOptions)

		}
	)

	https.createServer({
		key: fs.readFileSync('key.pem'),
		cert: fs.readFileSync('cert.pem')
	}, app)
	.listen(3000, function () {
		console.log('Listening on port 3000! Go to https://localhost:3000/')
	})


}

start()
