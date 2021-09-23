# Push objects to Salesforce

A node-based server that can push JSON-defined objects to Salesforce, using oauth2 for authentication


## Installation

1. Install Node JS
2. Place this folder somewhere convenient
3. Navigate to this folder in the terminal
4. Run `npm install`. This will install all the required packages for the application
5. Client key, client secret and callback URL are stored in the file `.env`. Copy the supplied `.example.env` file as `.env` and enter your own Salesforce details.

## SSL certificate
Salesforce requires the page to run under HTTPS. I used as self-certified SSL certificate to generate my `key.pem` and `cert.pem` files. [This link](https://web.archive.org/web/20120203022122/http://www.silassewell.com/blog/2010/06/03/node-js-https-ssl-server-example/) was helpful in generating them using OpenSSL in linux. You may be able to just use mine. Your browser will complain either way - they don't like self-signed SSL.

## Usage

1. Add your template file to /mappings (see below)
2. Navigate to this folder in the terminal
3. Run `npm run start`. You will see a message in the terminal telling you the server is running
4. Navigate to "https://localhost:3000" in your browser. *The HTTPS, rather than HTTP, is important*
5. Click the login button and you will be asked to authenticate to Salesforce
6. Once authenticated, you will land on the list page. It will show the mappings that are already uploaded in the account, and a list of files found in /mappings
7. Click upload on your mapping file.
8. The file will be uploaded and you will be redirected to a results page. Blocking errors will be shown at the top. Non-blocking errors will be shown in the body of the results JSON


## Template files

The files you place in /mappings must be JSON files, following this format:

```json
[
	{
		"objectType": "Mapping_Rule__c",
		"data": {
			"ObjectField1": "ObjectFieldValue",
			"another": "field"
		},
		"children": [
			{
				"a nested": "object"
			}
		]
	}
]
```

`objectType` and `data` are mandatory

When assigning children to parent objects, we assume that the parent "objectType" is the name of the field in the child.

e.g. the above example will include "Mapping_Rule__c": "returnedIdForParentMappingRule" when we save the child

