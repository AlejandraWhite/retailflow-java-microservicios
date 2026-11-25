package com.retailflow.order.controller;

import com.retailflow.order.dto.OrderRequest;
import com.retailflow.order.model.Order;
import com.retailflow.order.model.OrderEvent;
import com.retailflow.order.model.OrderStatus;
import com.retailflow.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Order create(@Valid @RequestBody OrderRequest request) { return service.create(request); }

    @GetMapping
    public List<Order> findAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public Order findById(@PathVariable Long id) { return service.findById(id); }

    @PutMapping("/{id}/status")
    public Order updateStatus(@PathVariable Long id, @RequestParam OrderStatus value) {
        return service.updateStatus(id, value);
    }

    @GetMapping("/{id}/events")
    public List<OrderEvent> events(@PathVariable Long id) { return service.events(id); }
}
