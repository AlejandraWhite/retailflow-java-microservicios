package com.retailflow.order.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "order_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderEvent {
    @Id
    private String id;
    private Long orderId;
    private String type;
    private String detail;
    private Instant createdAt;
}
