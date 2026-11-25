#!/bin/bash
# Despliega el Lambda process-order en LocalStack
set -e
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/.."

AWSL="docker exec retail-localstack awslocal"

echo ">> Cola y bucket"
$AWSL sqs create-queue --queue-name orders-queue > /dev/null
$AWSL s3 mb s3://retail-invoices 2>/dev/null || true

echo ">> Empaquetando"
rm -f process-order.zip
(cd lambda/process-order && /c/Windows/System32/tar.exe -a -cf ../../process-order.zip handler.py)
docker cp process-order.zip retail-localstack:/tmp/process-order.zip
rm -f process-order.zip

echo ">> Creando funcion"
$AWSL lambda delete-function --function-name process-order 2>/dev/null || true
$AWSL lambda create-function \
  --function-name process-order \
  --runtime python3.12 \
  --handler handler.handler \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --zip-file fileb:///tmp/process-order.zip \
  --timeout 30 \
  --environment "Variables={S3_ENDPOINT=http://retail-localstack:4566,INVOICE_BUCKET=retail-invoices}" \
  > /dev/null

echo ">> Esperando a que la funcion este activa"
$AWSL lambda wait function-active-v2 --function-name process-order

echo ">> Conectando SQS -> Lambda"
$AWSL lambda create-event-source-mapping \
  --function-name process-order \
  --event-source-arn arn:aws:sqs:us-east-1:000000000000:orders-queue \
  --batch-size 1 > /dev/null

echo "Listo."
