const fs = require('fs')
const https = require('https')
const host = 'enbuild-dev-ed.my.salesforce.com'

const successCodes = [200, 201]

const sfRequest = function(token, path, body){

	const options = {
        host: 'enbuild-dev-ed.my.salesforce.com',
        path: path,
        headers: {
          'Accept':'application/json',
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
	}

	if(body){
		options.method = 'POST'
	}

	return new Promise((resolve, reject) => {

			const req = https.request(options, function(res) {

				res.setEncoding('utf8');

				let data = ''

				res.on('data', function (chunk) {

					data += chunk
				
				});

				res.on('end', function () {

					const parsed = JSON.parse(data)

					if(!successCodes.includes(res.statusCode)){
						reject(parsed.map(error => {
							return `${error.errorCode}: ${error.message}`
						}))
					}else{
						resolve(parsed)
					}
				
				});

			
			})

			req.on('error', (error) => {
		
				reject('Rest error:' + error)
			})

			if(body){
				req.write(JSON.stringify(body))
			}

			req.end()

	})

}




const sfQuery = function(token, query){

	// e.g /services/data/v20.0/query/?q=SELECT+Name%2C+Id+from+Mapping_Rule__c+LIMIT+100
	const queryPath = `/services/data/v20.0/query/?q=${encodeURIComponent(query)}`

	return sfRequest(token, queryPath)

}


const getCreatePath = objectType => `/services/data/v47.0/sobjects/${objectType}/`


const sfCreateObject = async function(token, object, parentAttribute, parentValue){

	if(!object.data || !object.objectType){
		return {error: 'Data and objectType are required'}
	}

	if((!parentValue && parentAttribute) || (parentValue && !parentAttribute)){
		return {error: object.objectType + ': both parent attribute AND parent value are required'}
	}

	const toSave = Object.assign(
		{},
		object.data
	)

	if(parentAttribute){
		toSave[parentAttribute] = parentValue
	}

	let output = {
		objectType: object.objectType
	}

	try {
		let result = await sfRequest(token, getCreatePath(object.objectType), toSave)
		output.id = result.id
	}

	catch(err){
		output.error = err
	}

	finally {

		if(!output.error && object.children){

			const parentObjectType = object.objectType
			const parentId = output.id

			output.children = []

			const childProms = object.children.map( async childObject => {

				let childResult = await sfCreateObject(token, childObject, parentObjectType, parentId)
				output.children.push(childResult)


			})
			
			await Promise.all(childProms)

		}

		return output
	}

}


module.exports = {
	sfQuery,
	sfCreateObject
}