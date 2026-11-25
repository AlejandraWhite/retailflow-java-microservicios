package com.retailflow.product.service;

import com.retailflow.product.dto.ProductRequest;
import com.retailflow.product.model.Product;
import com.retailflow.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository repository;

    @Override
    public List<Product> findAll() {
        return repository.findAll();
    }

    @Override
    public Product findById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    @Override
    public Product create(ProductRequest r) {
        return repository.save(new Product(null, r.name(), r.description(), r.price(), r.stock()));
    }

    @Override
    public Product update(Long id, ProductRequest r) {
        Product p = findById(id);
        p.setName(r.name());
        p.setDescription(r.description());
        p.setPrice(r.price());
        p.setStock(r.stock());
        return repository.save(p);
    }

    @Override
    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
