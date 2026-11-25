package com.retailflow.product.service;

import com.retailflow.product.dto.ProductRequest;
import com.retailflow.product.model.Product;
import java.util.List;

public interface ProductService {
    List<Product> findAll();
    Product findById(Long id);
    Product create(ProductRequest request);
    Product update(Long id, ProductRequest request);
    void delete(Long id);
}
