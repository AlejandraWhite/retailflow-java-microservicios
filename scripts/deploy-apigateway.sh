#!/bin/bash
# Crea un API Gateway en LocalStack que expone POST /orders hacia el order-service
set -e
export MSYS_NO_PATHCONV=1
AWSL="docker exec retail-localstack awslocal"

API_ID=$($AWSL apigateway create-rest-api --name retailflow-api --query id --output text)
ROOT_ID=$($AWSL apigateway get-resources --rest-api-id $API_ID --query "items[0].id" --output text)

RES_ID=$($AWSL apigateway create-resource --rest-api-id $API_ID \
  --parent-id $ROOT_ID --path-part orders --query id --output text)

$AWSL apigateway put-method --rest-api-id $API_ID --resource-id $RES_ID \
  --http-method POST --authorization-type NONE > /dev/null

$AWSL apigateway put-integration --rest-api-id $API_ID --resource-id $RES_ID \
  --http-method POST --type HTTP_PROXY --integration-http-method POST \
  --uri http://order-service:8082/orders > /dev/null

$AWSL apigateway create-deployment --rest-api-id $API_ID --stage-name dev > /dev/null

echo "Listo. Prueba con:"
echo "curl -X POST http://localhost:4566/restapis/$API_ID/dev/_user_request_/orders -H 'Content-Type: application/json' -d '{...}'"
