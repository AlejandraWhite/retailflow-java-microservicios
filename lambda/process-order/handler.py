import json
import os
from datetime import datetime, timezone

import boto3

BUCKET = os.environ.get("INVOICE_BUCKET", "retail-invoices")

s3 = boto3.client(
    "s3",
    endpoint_url=os.environ.get("S3_ENDPOINT"),
    region_name="us-east-1",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)


def handler(event, context):
    for record in event["Records"]:
        order = json.loads(record["body"])
        order_id = order["orderId"]

        invoice = "\n".join([
            "===== FACTURA RETAILFLOW =====",
            f"Pedido:  {order_id}",
            f"Cliente: {order['customerName']}",
            f"Total:   ${order['total']}",
            f"Estado:  {order['status']}",
            f"Emitida: {datetime.now(timezone.utc).isoformat()}",
            "==============================",
        ])

        key = f"invoices/factura-{order_id}.txt"
        s3.put_object(Bucket=BUCKET, Key=key, Body=invoice.encode("utf-8"))
        print(f"Factura generada: s3://{BUCKET}/{key}")

    return {"processed": len(event["Records"])}
