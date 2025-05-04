"use server"

import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from '../utils';

export interface FlipkartProduct {
  title: string;
  price: number;
  rating: number;
  reviews: number;
  url: string;
}

export async function scrapeAmazonProduct(url: string) {
  if(!url) return;

  // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port =  33335;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: 'brd.superproxy.io',
    port,
    rejectUnauthorized: false,
  }

  try {
    // Fetch the product page
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // Extract the product title
    const title = $('#productTitle').text().trim();
    const currentPrice = extractPrice(
      $('.priceToPay span.a-price-whole'),
      $('.a.size.base.a-color-price'),
      $('.a-button-selected .a-color-base'),
    );

    const originalPrice = extractPrice(
      $('#priceblock_ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
      $('.a-size-base.a-color-price')
    );

    const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';

    const images = 
      $('#imgBlkFront').attr('data-a-dynamic-image') || 
      $('#landingImage').attr('data-a-dynamic-image') ||
      '{}'

    const imageUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency($('.a-price-symbol'))
    const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");

    const description = extractDescription($)

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || '$',
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: 'category',
      reviewsCount:100,
      stars: 4.5,
      isOutOfStock: outOfStock,
      description,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    }

    return data;
  } catch (error: any) {
    console.log(error);
  }
}

export async function scrapeFlipkartProducts(searchQuery: string): Promise<FlipkartProduct[]> {
  try {
    // Convert search query to Flipkart URL format
    const formattedQuery = searchQuery.replace(/\s+/g, '+');
    const url = `https://www.flipkart.com/search?q=${formattedQuery}`;
    
    // Add headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);
    console.log('Cheerio loaded response data');
    const products: FlipkartProduct[] = [];

    // Select each product card
    $('div[data-id]').each((_, element) => {
      const title = $(element).find('a[title]').attr('title') || '';
      const priceText = $(element).find('div._30jeq3').text();
      const rating = parseFloat($(element).find('div._3LWZlK').text()) || 0;
      const reviewsText = $(element).find('span._2_R_DZ').text();
      const reviews = parseInt(reviewsText.replace(/[^\d]/g, '')) || 0;
      const productUrl = 'https://www.flipkart.com' + $(element).find('a[href]').attr('href');

      // Clean price text and convert to number
      const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;

      if (title && price) {
        products.push({
          title,
          price,
          rating,
          reviews,
          url: productUrl
        });
      }
    });
    console.log('printing products', products)
    return products;
  } catch (error) {
    console.error('Error scraping Flipkart:', error);
    return [];
  }
} 