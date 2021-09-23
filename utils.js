const path = require('path')
const fs = require('fs')
const rest = require('./rest')

const dataFilePath = path.join(__dirname, 'mappings')

const getAllDataFiles = () => {

	return new Promise((resolve, reject) => {

		fs.readdir(dataFilePath, (err, files) => {

			if(err){
				reject('Unable to load data filers: ' + err)
			}

			resolve(files)

		})

	})

}

const uploadFile = async (token,file) => {

	const renderOptions = {
		fileName: null,
		errors: [],
		outputJson: [],
		output: null
	}

	const addError = error => {

		const errors = Array.isArray(error) ? error : [error]
		renderOptions.errors = [...renderOptions.errors, ...errors]

	}

	if(!file){
		addError('No file specified')
		// cant continue without a file
		return renderOptions
	}

	// get our data
	let fileData, json

	try {
		fileData = fs.readFileSync(path.join(dataFilePath, file))
		json = JSON.parse(fileData)

		renderOptions.fileName = file
	}

	catch(err) {
		addError('Unable to read and parse JSON file: ' + err)
		// cant continue without valid JSON
		return renderOptions
	}

	// start sending to the API
	try {

		// accept array or single
		if(!Array.isArray(json)){
			json = [json]
		}

		const saving = json.map(async (object) => {

			try {
				let result = await rest.sfCreateObject(token, object)
				renderOptions.outputJson.push(result)
			}

			catch(err){
				addError(err)
			}

		})


		await Promise.all(saving)

		renderOptions.output = JSON.stringify(renderOptions.outputJson)

		return renderOptions
	}

	catch(err) {
		addError('Unable to create all mappings: ' + err)
		return renderOptions
	}

}




module.exports = {
	getAllDataFiles,
	uploadFile
}