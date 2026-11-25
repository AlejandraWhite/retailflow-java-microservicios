package com.retailflow.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record OrderRequest(
        @NotBlank String customerName,
        @NotEmpty @Valid List<OrderItemRequest> items) {
}
