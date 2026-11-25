package com.retailflow.order.service;

import com.retailflow.order.dto.OrderRequest;
import com.retailflow.order.model.Order;
import com.retailflow.order.model.OrderEvent;
import com.retailflow.order.model.OrderStatus;
import java.util.List;

public interface OrderService {
    Order create(OrderRequest request);
    Order findById(Long id);
    List<Order> findAll();
    Order updateStatus(Long id, OrderStatus status);
    List<OrderEvent> events(Long orderId);
}
