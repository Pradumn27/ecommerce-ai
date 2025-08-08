import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addCart } from '../redux/action';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const Categories = ({ filterProduct, categories, loading }) => {
  if (loading) {
    return (
      <div className="buttons text-center py-2">
        <Skeleton height={32} width={90} className="m-2" />
        <Skeleton height={32} width={140} className="m-2" />
        <Skeleton height={32} width={140} className="m-2" />
        <Skeleton height={32} width={120} className="m-2" />
      </div>
    );
  }
  return (
    <div className="buttons text-center py-2">
      <button
        className="btn btn-outline-dark btn-sm m-2"
        onClick={() => filterProduct('all')}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c}
          className="btn btn-outline-dark btn-sm m-2 text-capitalize"
          onClick={() => filterProduct(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
};

const ShowProducts = ({
  searchText,
  setSearchText,
  executeSearch,
  searching,
  hasSearched,
  filteredProducts,
  addProduct,
  filterProduct,
  categories,
  categoriesLoading,
  onClearSearch,
}) => {
  return (
    <>
      <div
        className="text-center py-3 d-flex gap-2"
        style={{ justifyContent: 'center' }}
      >
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') executeSearch();
          }}
          className="form-control"
          placeholder="Try: running shoes under $100 with good reviews"
          style={{ maxWidth: 520 }}
        />
        <button className="btn btn-dark" onClick={executeSearch}>
          Search
        </button>
      </div>

      <Categories
        filterProduct={filterProduct}
        categories={categories}
        loading={categoriesLoading}
      />

      {searching ? (
        <div className="row w-100 justify-content-center">
          <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
            <Skeleton height={592} />
          </div>
          <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
            <Skeleton height={592} />
          </div>
          <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
            <Skeleton height={592} />
          </div>
        </div>
      ) : !filteredProducts.length && hasSearched ? (
        <div className="text-center my-4">
          <h5>No results found</h5>
          {searchText && <p className="text-muted">for "{searchText}"</p>}
          <div className="d-flex justify-content-center gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={onClearSearch}
            >
              Clear search
            </button>
            <button className="btn btn-dark" onClick={executeSearch}>
              Try again
            </button>
          </div>
        </div>
      ) : (
        filteredProducts.map((product) => {
          return (
            <div
              id={product.id}
              key={product.id}
              className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4"
            >
              <div className="card text-center h-100" key={product.id}>
                <img
                  className="card-img-top p-3"
                  src={product.image}
                  alt="Card"
                  height={300}
                />
                <div className="card-body">
                  <h5 className="card-title">
                    {product.title.substring(0, 12)}...
                  </h5>
                  <p className="card-text">
                    {product.description.substring(0, 90)}...
                  </p>
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item lead">$ {product.price}</li>
                  <li className="list-group-item">
                    <small className="text-muted">{product.category}</small>
                  </li>
                  {product.rating && (
                    <li className="list-group-item">
                      <small className="text-muted">
                        {product.rating.rate} <i className="fa fa-star"></i>
                      </small>
                    </li>
                  )}
                  {/* <li className="list-group-item">Dapibus ac facilisis in</li>
                    <li className="list-group-item">Vestibulum at eros</li> */}
                </ul>
                <div className="card-body">
                  <Link
                    to={'/product/' + product.id}
                    className="btn btn-dark m-1"
                  >
                    Buy Now
                  </Link>
                  <button
                    className="btn btn-dark m-1"
                    onClick={() => {
                      toast.success('Added to cart');
                      addProduct(product);
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </>
  );
};

const Products = () => {
  const [data, setData] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const dispatch = useDispatch();

  const addProduct = (product) => {
    dispatch(addCart(product));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [resProducts, resCategories] = await Promise.all([
          axios.get('http://localhost:4000/api/v1/catalog'),
          axios.get('http://localhost:4000/api/v1/categories'),
        ]);
        const products = resProducts.data?.products || [];
        setData(products);
        setFilteredProducts(products);
        const cats = resCategories.data?.categories || [];
        setCategories(cats);
      } catch (e) {
        setData([]);
        setFilteredProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
        setCategoriesLoading(false);
      }
    };
    load();
  }, []);

  // Reserved for future advanced category mapping when combining server AI with client hints
  // const normalizedCategories = useMemo(() => ({}), []);

  const applyCategoryOnly = (source, category) => {
    if (!category || category === 'all') return source;
    return source.filter((p) => p.category === category);
  };

  const executeSearch = async () => {
    const trimmed = searchText.trim();
    if (trimmed === '') {
      setFilteredProducts(applyCategoryOnly(data, selectedCategory));
      setHasSearched(false);
      return;
    }
    try {
      setSearching(true);
      setHasSearched(true);
      const res = await axios.post(
        'http://localhost:4000/api/v1/catalog/search',
        {
          query: trimmed,
          category: selectedCategory,
        }
      );
      const results = res.data?.products || [];
      setFilteredProducts(results);
    } catch (e) {
      setFilteredProducts(applyCategoryOnly(data, selectedCategory));
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setHasSearched(false);
    setFilteredProducts(applyCategoryOnly(data, selectedCategory));
  };

  const Loading = () => {
    return (
      <>
        <div className="col-12 py-5 text-center">
          <Skeleton height={40} width={560} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
        <div className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
          <Skeleton height={592} />
        </div>
      </>
    );
  };

  const filterProduct = (cat) => {
    setSelectedCategory(cat);
    setFilteredProducts(applyCategoryOnly(data, cat));
  };

  return (
    <>
      <div className="container my-3 py-3">
        <div className="row">
          <div className="col-12">
            <h2 className="display-5 text-center">Latest Products</h2>
            <hr />
          </div>
        </div>
        <div className="row justify-content-center">
          {loading ? (
            <Loading />
          ) : (
            <ShowProducts
              searchText={searchText}
              setSearchText={setSearchText}
              executeSearch={executeSearch}
              searching={searching}
              hasSearched={hasSearched}
              filteredProducts={filteredProducts}
              addProduct={addProduct}
              filterProduct={filterProduct}
              categories={categories}
              categoriesLoading={categoriesLoading}
              onClearSearch={clearSearch}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Products;
