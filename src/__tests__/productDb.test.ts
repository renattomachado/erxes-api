import { dealFactory, fieldFactory, productCategoryFactory, productFactory } from '../db/factories';
import { Deals, ProductCategories, Products } from '../db/models';

import { IDealDocument, IProductCategoryDocument, IProductDocument } from '../db/models/definitions/deals';
import './setup.ts';

describe('Test products model', () => {
  let product: IProductDocument;
  let deal: IDealDocument;
  let deal2: IDealDocument;
  let productCategory: IProductCategoryDocument;

  beforeEach(async () => {
    // Creating test data
    product = await productFactory({ type: 'service' });
    productCategory = await productCategoryFactory({});
    deal = await dealFactory({ productsData: [{ productId: product._id }] });
    deal2 = await dealFactory({ productsData: [{ productId: product._id }] });
  });

  afterEach(async () => {
    // Clearing test data
    await Products.deleteMany({});
    await Deals.deleteMany({});
    await ProductCategories.deleteMany({});
  });

  test('Get product', async () => {
    try {
      await Products.getProduct({ _id: 'fakeId' });
    } catch (e) {
      expect(e.message).toBe('Product not found');
    }

    const response = await Products.getProduct({ _id: product._id });

    expect(response).toBeDefined();
  });

  test('Create product', async () => {
    const args: any = {
      name: product.name,
      type: product.type,
      description: product.description,
      sku: product.sku,
      categoryId: productCategory._id,
      code: '123',
    };

    let productObj = await Products.createProduct(args);

    expect(productObj).toBeDefined();
    expect(productObj.name).toEqual(product.name);
    expect(productObj.type).toEqual(product.type);
    expect(productObj.description).toEqual(product.description);
    expect(productObj.sku).toEqual(product.sku);

    // testing product category
    args.categoryCode = productCategory.code;
    args.code = '234';
    productObj = await Products.createProduct(args);

    expect(productObj.categoryId).toBe(productCategory._id);
  });

  test('Update product', async () => {
    const args: any = {
      name: `${product.name}-update`,
      type: `${product.type}-update`,
      description: `${product.description}-update`,
      sku: `${product.sku}-update`,
      categoryId: productCategory._id,
      code: '321',
    };

    let productObj = await Products.updateProduct(product._id, args);

    expect(productObj).toBeDefined();
    expect(productObj.name).toEqual(`${product.name}-update`);
    expect(productObj.type).toEqual(`${product.type}-update`);
    expect(productObj.description).toEqual(`${product.description}-update`);
    expect(productObj.sku).toEqual(`${product.sku}-update`);

    // testing custom field data
    const field = await fieldFactory({ contentType: 'product', contentTypeId: product._id });
    args.customFieldsData = {
      [field._id]: 10,
    };

    productObj = await Products.updateProduct(product._id, args);

    expect(productObj.customFieldsData[field._id]).toBe(10);
  });

  test('Can not remove products', async () => {
    expect.assertions(1);

    try {
      await Products.removeProducts([product._id]);
    } catch (e) {
      expect(e.message).toEqual(`Can not remove products. Following deals are used ${deal.name},${deal2.name}`);
    }
  });

  test('Remove product', async () => {
    await Deals.updateOne({ _id: deal._id }, { $set: { productsData: [] } });
    await Deals.updateOne({ _id: deal2._id }, { $set: { productsData: [] } });

    const isDeleted = await Products.removeProducts([product._id]);

    expect(isDeleted).toBeTruthy();
  });

  test('Get product category', async () => {
    try {
      await ProductCategories.getProductCatogery({ _id: 'fakeId' });
    } catch (e) {
      expect(e.message).toBe('Product & service category not found');
    }

    const response = await ProductCategories.getProductCatogery({ _id: productCategory._id });

    expect(response).toBeDefined();
  });

  test('Create product category', async () => {
    const doc: any = {
      name: 'Product name',
      code: 'create1234',
    };

    let response = await ProductCategories.createProductCategory(doc);

    expect(response.name).toBe(doc.name);
    expect(response.code).toBe(doc.code);

    // if parentId
    doc.parentId = productCategory._id;
    doc.code = 'create12345';

    response = await ProductCategories.createProductCategory(doc);

    expect(response.parentId).toBe(productCategory._id);
  });

  test('Update product category (Error: Cannot change category)', async () => {
    const parentCategory = await productCategoryFactory({ parentId: productCategory._id });

    const doc: any = {
      name: 'Updated product name',
      code: 'error1234',
      parentId: parentCategory._id,
    };

    try {
      await ProductCategories.updateProductCategory(productCategory._id, doc);
    } catch (e) {
      expect(e.message).toBe('Cannot change category');
    }
  });

  test('Update product category', async () => {
    const doc: any = {
      name: 'Updated product name',
      code: 'update1234',
    };

    let response = await ProductCategories.updateProductCategory(productCategory._id, doc);

    expect(response.name).toBe(doc.name);
    expect(response.code).toBe(doc.code);

    // updating child categories order
    const childCategory = await productCategoryFactory({ code: 'create123456', order: productCategory.order });

    delete doc.code;
    response = await ProductCategories.updateProductCategory(childCategory._id, doc);

    expect(response.code).toBe(childCategory.code);
  });

  test('Remove product category', async () => {
    await ProductCategories.removeProductCategory(productCategory._id);

    expect(await ProductCategories.find().count()).toBe(0);
  });

  test('Remove product category (Error: Can`t remove a product category)', async () => {
    await productFactory({ categoryId: productCategory._id });
    await productFactory({ categoryId: productCategory._id });

    try {
      await ProductCategories.removeProductCategory(productCategory._id);
    } catch (e) {
      expect(e.message).toBe("Can't remove a product category");
    }
  });
});
