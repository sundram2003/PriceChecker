import { useEffect, useState } from 'react';
import { scrapeFlipkartProducts } from '@/lib/flipkartScraper';

interface FlipkartPriceComparisonProps {
  productTitle: string;
  originalPrice: number;
}

export default function FlipkartPriceComparison({ productTitle, originalPrice }: FlipkartPriceComparisonProps) {
  const [flipkartProducts, setFlipkartProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFlipkartPrices() {
      try {
        const products = await scrapeFlipkartProducts(productTitle);
        setFlipkartProducts(products);
      } catch (err) {
        setError('Failed to fetch Flipkart prices');
        console.error('Error fetching Flipkart prices:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFlipkartPrices();
  }, [productTitle]);

  if (loading) {
    return <div className="mt-4 p-4 bg-gray-100 rounded-lg">Loading Flipkart prices...</div>;
  }

  if (error) {
    return <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  if (flipkartProducts.length === 0) {
    return <div className="mt-4 p-4 bg-gray-100 rounded-lg">No matching products found on Flipkart</div>;
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Also available on Flipkart:</h3>
      <div className="space-y-2">
        {flipkartProducts.map((product, index) => (
          <div key={index} className="p-3 bg-white rounded-md shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{product.title}</p>
                <p className="text-green-600 font-bold">₹{product.price.toLocaleString()}</p>
                {product.rating > 0 && (
                  <p className="text-sm text-gray-600">
                    Rating: {product.rating} ({product.reviews} reviews)
                  </p>
                )}
              </div>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View on Flipkart
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 