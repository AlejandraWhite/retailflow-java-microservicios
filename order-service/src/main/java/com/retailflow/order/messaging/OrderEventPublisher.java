package com.retailflow.order.messaging;

import com.retailflow.order.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.GetQueueUrlRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

@Component
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

    private final SqsClient sqs;
    private final String queueName;

    public OrderEventPublisher(SqsClient sqs, @Value("${aws.queue-name}") String queueName) {
        this.sqs = sqs;
        this.queueName = queueName;
    }

    public void publishOrderCreated(Order order) {
        try {
            String queueUrl = sqs.getQueueUrl(
                    GetQueueUrlRequest.builder().queueName(queueName).build()).queueUrl();
            String customer = order.getCustomerName().replace("\"", "'");
            String body = String.format(
                    "{\"orderId\":%d,\"customerName\":\"%s\",\"total\":%s,\"status\":\"%s\"}",
                    order.getId(), customer, order.getTotal(), order.getStatus());
            sqs.sendMessage(SendMessageRequest.builder()
                    .queueUrl(queueUrl).messageBody(body).build());
            log.info("Pedido {} publicado en SQS", order.getId());
        } catch (Exception e) {
            // Un fallo de la cola no debe tumbar la creacion del pedido
            log.warn("No se pudo publicar el pedido {} en SQS: {}", order.getId(), e.getMessage());
        }
    }
}
