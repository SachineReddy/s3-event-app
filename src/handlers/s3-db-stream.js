const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.S3_EVENT_TABLE;

exports.s3EventDbStreamHandler  = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const eventName = event.Records[0].eventName;
  
  if(eventName == "INSERT") {
      const fileName = event.Records[0].dynamodb.Keys.fileName.S;
      const timestamp = event.Records[0].dynamodb.Keys.timestamp.S;
      
      const metadataName = "Metadata_" + tableName;
      const metadataSortKey = "0000";
      
      if(fileName != metadataName) {
        const status = event.Records[0].dynamodb.NewImage.status.S;
        const metadataObj = {
            "fileName": fileName,
            "timestamp": timestamp,
            "status": status
        }
        
        const params = {
            TableName: tableName,    
            KeyConditionExpression: "fileName = :fname",    
            ExpressionAttributeValues: {
                ":fname": metadataName,         
            }
        };
        
        documentClient.query(params, function(err, data) {
            if (err) {
                console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                console.log("succeeded:", JSON.stringify(data, null, 2));
                let metadataArr = [];
                if(data.Items && data.Items[0]){                    
                    metadataArr = data.Items[0].latestRecords                    
                    if(metadataArr.length == 25) {
                        metadataArr.pop();
                    }            
                }
                metadataArr.unshift(metadataObj);
                const documentParams = {
                    TableName: tableName,
                    Key:{
                      "fileName": metadataName,
                      "timestamp": metadataSortKey,   
                    },
                    UpdateExpression: "set latestRecords= :latestRecords",
                    ExpressionAttributeValues:{                             
                        ":latestRecords":metadataArr
                    },
                    ReturnValues:"UPDATED_NEW"          
                  }
                
                  documentClient.update(documentParams, function(err, data) {
                    if (err) {
                      console.log(err, err.stack);
                    } else {
                      console.log("Added entry in DB", data);
                    }
                  });
                      
            }
        });
        
      }
  }
  
};
