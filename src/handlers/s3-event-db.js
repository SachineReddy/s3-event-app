const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.S3_EVENT_TABLE;

exports.s3EventDatabaseHandler  = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  let eventName = event.Records[0].eventName;
  if(eventName.startsWith("ObjectCreated"))
    eventName = "Created";

  const eventTime = event.Records[0].eventTime;
  const size = event.Records[0].s3.object.size ? event.Records[0].s3.object.size : 0;
  let versionId = event.Records[0].s3.object.versionId;

  const documentGetParams = {
    TableName: tableName,
    IndexName: 'versionLSI',
    ProjectionExpression:"fileName, versionId",
    KeyConditionExpression: "fileName = :fname and versionId = :versionId",    
    ExpressionAttributeValues: {
        ":fname": key,
        ":versionId": "v_0",        
    }
  }
  
  documentClient.query(documentGetParams, function(err, data) {
    if (err) {
        console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
    } if(data) {        
        if(data.Items[0] == null || data.Items[0] == undefined){        
            versionId = "v_0";
        } else {            
            if(eventName.startsWith("ObjectRemoved")) {
              eventName = "Removed";
            } else {
              eventName = "Updated";
            }
            console.log("Item file info : " + data.Items[0].fileName );
        }

        const documentParams = {
          TableName: tableName,
          Item: {
            "fileName": key,
            "timestamp": eventTime,
            "status": eventName,
            "size": size,
            "versionId": versionId
          }
        }
      
        documentClient.put(documentParams, function(err, data) {
          if (err) {
            console.log(err, err.stack);
          } else {
            console.log("Added entry in DB", data);
          }
        });

    }
  });

};
