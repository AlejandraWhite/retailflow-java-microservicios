package com.retailflow.order.repository;

import com.retailflow.order.model.OrderEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface OrderEventRepository extends MongoRepository<OrderEvent, String> {
    List<OrderEvent> findByOrderIdOrderByCreatedAtAsc(Long orderId);
}
