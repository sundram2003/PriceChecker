import axios from 'axios';
import * as cheerio from 'cheerio';

export interface FlipkartProduct {
  title: string;
  price: number;
  rating: number;
  reviews: number;
  url: string;
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

    return products;
  } catch (error) {
    console.error('Error scraping Flipkart:', error);
    return [];
  }
} 