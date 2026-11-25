package com.retailflow.order.client;

import com.retailflow.order.dto.ProductResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ProductClient {

    private final RestClient restClient;

    public ProductClient(@Value("${product-service.url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public ProductResponse getProduct(Long id) {
        try {
            return restClient.get().uri("/products/{id}", id)
                    .retrieve().body(ProductResponse.class);
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No se pudo obtener el producto " + id + " (existe y esta product-service arriba?)");
        }
    }
}
