import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Returns & Refunds — BARELYN' };

export default function ReturnsPage() {
	return (
		<LegalPage
			eyebrow="Legal"
			title="Return, Refund & Cancellation Policy"
			intro={[
				'At Barelyn, we want you to have a positive experience with every order.',
				'Because our products are skincare and personal-care products, returns are subject to hygiene, safety and product-condition requirements.',
			]}
			sections={[
				{
					heading: '1. Eligible Returns',
					paragraphs: ['A return, replacement or refund may be considered in the following situations:'],
					bullets: [
						'Wrong product delivered',
						'Product received damaged',
						'Product received in a defective condition',
						'Product missing from the order',
						'Product significantly different from the product ordered',
						'Product received with a manufacturing/packaging issue, subject to verification',
					],
				},
				{
					heading: '2. Products Not Eligible for Return',
					paragraphs: ['For hygiene and safety reasons, we generally do not accept returns for products that have been:'],
					bullets: [
						'Opened',
						'Used',
						'Partially used',
						'Altered',
						'Damaged after delivery due to customer handling',
						'Returned without the original packaging, where the packaging is necessary to verify the product',
					],
				},
				{
					heading: '3. Return Request Period',
					paragraphs: [
						'Customers should contact Barelyn within 48 hours of receiving the order for eligible return, replacement or damage-related claims.',
						'Requests submitted after the applicable period may not be accepted except where required by applicable law.',
					],
				},
				{
					heading: '4. How to Request a Return or Replacement',
					paragraphs: ['To request a return, replacement or refund, contact customercare@barelyn.co.in and please provide:'],
					bullets: [
						'Order number',
						'Customer name',
						'Registered mobile number/email',
						'Product name',
						'Reason for the request',
						'Photographs/videos of the product and packaging',
						'Any other information reasonably requested by Barelyn',
					],
				},
				{
					heading: '5. Verification',
					paragraphs: [
						'Barelyn may review the submitted information before approving a return, replacement or refund.',
						'We may request photographs, videos, batch details, packaging information or other evidence to verify the issue.',
						'Approval of a request does not automatically guarantee a refund until the product/claim has been verified where verification is required.',
					],
				},
				{
					heading: '6. Damaged Products',
					paragraphs: [
						'If you receive a damaged product, please contact us as soon as possible after delivery.',
						'Photographs and videos of the outer package, shipping label, product and damage may be required.',
						'Where the claim is approved, Barelyn may provide a replacement of the product, a refund of the eligible amount, or another appropriate resolution, depending on product availability and circumstances.',
					],
				},
				{
					heading: '7. Wrong Product',
					paragraphs: [
						'If Barelyn sends you a product different from the product ordered, please contact us within the return request period.',
						'After verification, Barelyn may arrange a replacement or refund as applicable.',
					],
				},
				{
					heading: '8. Refunds',
					paragraphs: [
						'Once a refund is approved, the eligible refund amount will generally be processed to the original payment method, unless another method is agreed or required.',
						'Approved refunds will normally be initiated within 5–7 business days after approval.',
						'The time taken for the amount to reflect in your bank account, card or payment account may depend on the payment service provider or bank.',
					],
				},
				{
					heading: '9. Shipping Charges',
					paragraphs: [
						'Where the return/replacement is due to an error attributable to Barelyn, such as an incorrect or damaged product, Barelyn will generally bear the applicable return/replacement shipping cost.',
						"For any other return request, shipping charges may be non-refundable or may be borne by the customer, subject to applicable law and Barelyn's approval.",
					],
				},
				{
					heading: '10. Order Cancellation',
					paragraphs: [
						'Customers may request cancellation by contacting Barelyn at +91 83600-95146 as soon as possible after placing an order.',
						'Cancellation requests may not be accepted once the order has been processed, packed or shipped.',
						'If a cancellation is successfully approved after payment, the eligible amount will be refunded according to the applicable refund process.',
					],
				},
				{
					heading: '11. Refused or Undelivered Orders',
					paragraphs: [
						'If an order is returned to Barelyn because of an incorrect address, repeated failed delivery attempts or refusal to accept the package, Barelyn may contact the customer regarding re-shipment or refund.',
						'Any applicable shipping or handling costs may be deducted from the refund where permitted by law and depending on the circumstances.',
					],
				},
				{
					heading: '12. Promotional Products and Free Gifts',
					paragraphs: [
						'Products provided free of charge as part of a promotion may not be eligible for a separate refund.',
						'If an order is returned or cancelled, promotional benefits may be adjusted or cancelled as applicable.',
					],
				},
				{
					heading: '13. Product Allergies or Skin Reactions',
					paragraphs: [
						'Barelyn products are cosmetic products and individual skin reactions may vary.',
						'A reaction or dissatisfaction with the cosmetic result does not automatically constitute a defective product.',
						'Customers should follow the product instructions and discontinue use if significant irritation occurs.',
						'For serious or persistent reactions, seek advice from a qualified healthcare professional.',
					],
				},
				{
					heading: '14. Fraudulent or Abusive Claims',
					paragraphs: [
						'Barelyn reserves the right to investigate and reject claims that appear fraudulent, abusive, manipulated or inconsistent with the available evidence, subject to applicable law.',
					],
				},
				{
					heading: '15. Consumer Rights',
					paragraphs: [
						'Nothing in this Return, Refund & Cancellation Policy is intended to exclude or limit any rights or remedies that cannot legally be excluded or limited under applicable Indian law.',
					],
				},
				{
					heading: '16. Contact Us',
					paragraphs: ['For return, refund or cancellation requests:'],
					bullets: [
						'Email: customercare@barelyn.co.in',
						'Phone/WhatsApp: +91 83600-95146',
						'Address: Basant Avenue, Ludhiana, Punjab, India, 141013',
					],
				},
			]}
		/>
	);
}
