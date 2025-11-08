export interface User {
  name: string;
  email: string;
  password: string;
  title: string;
  birth_date: string;
  birth_month: string;
  birth_year: string;
  firstname: string;
  lastname: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  zipcode: string;
  state: string;
  city: string;
  mobile_number: string;
}

export interface Product {
  id: number;
  name: string;
  price: string;
  brand: string;
  category: {
    usertype: {
      usertype: string;
    };
    category: string;
  };
}

export interface Brand {
  id: number;
  brand: string;
}

export interface ApiResponse {
  responseCode: number;
  message?: string;
}

export interface ProductsResponse extends ApiResponse {
  products?: Product[];
}

export interface BrandsResponse extends ApiResponse {
  brands?: Brand[];
}

export interface UserResponse extends ApiResponse {
  user?: User;
}
