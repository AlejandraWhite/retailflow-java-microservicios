package com.retailflow.order.service;

import com.retailflow.order.client.ProductClient;
import com.retailflow.order.dto.OrderRequest;
import com.retailflow.order.dto.ProductResponse;
import com.retailflow.order.model.*;
import com.retailflow.order.repository.OrderEventRepository;
import com.retailflow.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import com.retailflow.order.messaging.OrderEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderEventRepository eventRepository;
    private final ProductClient productClient;
    private final OrderEventPublisher publisher;

    @Override
    @Transactional
    public Order create(OrderRequest request) {
        Order order = new Order();
        order.setCustomerName(request.customerName());
        order.setStatus(OrderStatus.CREATED);
        order.setCreatedAt(Instant.now());

        BigDecimal total = BigDecimal.ZERO;
        for (var item : request.items()) {
            ProductResponse product = productClient.getProduct(item.productId());
            if (product.stock() < item.quantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Stock insuficiente para " + product.name());
            }
            OrderItem oi = new OrderItem(null, product.id(), product.name(),
                    item.quantity(), product.price());
            order.getItems().add(oi);
            total = total.add(product.price().multiply(BigDecimal.valueOf(item.quantity())));
        }
        order.setTotal(total);

        Order saved = orderRepository.save(order);
        registerEvent(saved.getId(), "CREATED", "Pedido creado por " + saved.getCustomerName());
        publisher.publishOrderCreated(saved);
        return saved;
    }

    @Override
    public Order findById(Long id) {
        return orderRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
    }

    @Override
    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    @Override
    @Transactional
    public Order updateStatus(Long id, OrderStatus status) {
        Order order = findById(id);
        OrderStatus previous = order.getStatus();
        order.setStatus(status);
        Order saved = orderRepository.save(order);
        registerEvent(id, status.name(), "Estado cambio de " + previous + " a " + status);
        return saved;
    }

    @Override
    public List<OrderEvent> events(Long orderId) {
        findById(orderId);
        return eventRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
    }

    private void registerEvent(Long orderId, String type, String detail) {
        eventRepository.save(new OrderEvent(null, orderId, type, detail, Instant.now()));
    }
}
