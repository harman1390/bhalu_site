import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Shipping & Delivery — BARELYN' };

export default function ShippingPage() {
	return (
		<LegalPage
			eyebrow="Legal"
			title="Shipping & Delivery Policy"
			intro={[
				'Thank you for choosing Barelyn. We aim to make your order experience simple, reliable and convenient.',
				'This Shipping & Delivery Policy explains how orders placed through www.barelyn.co.in are processed and delivered.',
			]}
			sections={[
				{
					heading: '1. Order Processing',
					paragraphs: [
						'Orders are generally processed within 1–2 business days after successful payment and order confirmation.',
						'Orders placed on Sundays or public holidays may be processed on the next business day.',
						'During sales, promotional campaigns, new product launches or other high-demand periods, processing may take longer.',
					],
				},
				{
					heading: '2. Delivery Time',
					paragraphs: [
						'Once your order has been dispatched, estimated delivery is generally 3–7 business days.',
						'Delivery timelines may vary depending on:',
					],
					bullets: [
						'Delivery location',
						'Courier availability',
						'Weather conditions',
						'Public holidays',
						'Natural disasters',
						'Transportation disruptions',
						'Remote or difficult-to-service locations',
						"Other circumstances beyond Barelyn's reasonable control",
					],
				},
				{
					heading: '3. Shipping Charges',
					paragraphs: [
						'Shipping charges, if applicable, will be displayed during checkout before you complete your purchase.',
						'Barelyn may offer free shipping on selected orders, products, locations or promotional periods.',
						'Any applicable shipping charges will be communicated before order confirmation.',
					],
				},
				{
					heading: '4. Delivery Address',
					paragraphs: ['Customers are responsible for providing a complete and accurate delivery address, including:'],
					bullets: [
						'Name',
						'House/Flat number',
						'Street/locality',
						'City',
						'State',
						'PIN code',
						'Valid mobile number',
					],
				},
				{
					heading: '5. Order Tracking',
					paragraphs: [
						'Where tracking is available, customers may receive a tracking link or tracking number through email, SMS, WhatsApp or other available communication channels.',
						'Tracking information is provided by the applicable delivery partner and may take some time to update after dispatch.',
					],
				},
				{
					heading: '6. Delayed Delivery',
					paragraphs: [
						'If your order is delayed beyond the estimated delivery period, please contact us at barelyn.co.in@gmail.com or +91 83600-95146.',
						'We will coordinate with the relevant delivery partner and try to resolve the issue.',
					],
				},
				{
					heading: '7. Failed Delivery Attempts',
					paragraphs: [
						'If a delivery attempt fails because the customer is unavailable, the address is incorrect or incomplete, the customer refuses the package, does not respond to the delivery partner, or is unavailable for repeated delivery attempts, the package may be returned to Barelyn.',
						'Additional shipping charges may apply if the customer requests re-shipment, where permitted.',
					],
				},
				{
					heading: '8. Damaged Package',
					paragraphs: ['If your package appears visibly damaged, tampered with or opened at the time of delivery, please:'],
					numbered: [
						'Take video of the package before opening it.',
						'Record the issue with the delivery partner where possible.',
						'Contact Barelyn as soon as possible.',
						'Provide your order number and supporting photographs and videos.',
					],
				},
				{
					heading: '9. Incorrect or Missing Product',
					paragraphs: [
						'If you receive an incorrect, missing or damaged product, please contact us within 48 hours of delivery.',
						'Please provide:',
					],
					bullets: [
						'Order number',
						'Photographs and videos of the package',
						'Photographs of the product received',
						'Description of the issue',
					],
				},
				{
					heading: '10. Delivery Partners',
					paragraphs: [
						'Barelyn may use third-party logistics and courier companies for order delivery.',
						'Delivery timelines and tracking updates may therefore depend partly on the courier partner.',
					],
				},
				{
					heading: '11. International Shipping',
					paragraphs: [
						'Unless specifically stated on the website, Barelyn currently ships only within India.',
						'If international shipping becomes available, this policy will be updated accordingly.',
					],
				},
				{
					heading: '12. Contact Us',
					paragraphs: ['For shipping or delivery-related questions:'],
					bullets: [
						'Email: barelyn.co.in@gmail.com',
						'Phone/WhatsApp: +91 83600-95146',
						'Address: Basant Avenue, Ludhiana, Punjab, India, 141013',
					],
				},
			]}
		/>
	);
}
