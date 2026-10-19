import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy — BARELYN' };

export default function PrivacyPolicyPage() {
	return (
		<LegalPage
			eyebrow="Legal"
			title="Privacy Policy"
			intro={[
				'Welcome to Barelyn ("Barelyn", "we", "us", or "our"). This Privacy Policy explains how we collect, use, store, and protect your personal information when you visit or use our website www.barelyn.co.in, purchase our products, contact us, or otherwise interact with our services.',
				'By using our website, you acknowledge that you have read and understood this Privacy Policy.',
			]}
			sections={[
				{
					heading: '1. Information We Collect',
					paragraphs: [
						'Depending on how you interact with Barelyn, we may collect the following information.',
						'A. Personal Information — when you place an order or create an account, we may collect:',
					],
					bullets: [
						'Full name',
						'Mobile number',
						'Email address',
						'Billing address',
						'Shipping/delivery address',
						'Order details',
						'Payment and transaction-related information',
						'Any other information you voluntarily provide to us',
					],
				},
				{
					heading: 'B. Technical Information',
					paragraphs: ['When you visit our website, certain information may be collected automatically, such as:'],
					bullets: [
						'IP address',
						'Browser type',
						'Device type',
						'Operating system',
						'Pages visited',
						'Website interaction information',
						'Date and time of visits',
						'Referring website or source',
					],
				},
				{
					heading: 'C. Cookies',
					paragraphs: ['Barelyn may use cookies and similar technologies to:'],
					bullets: [
						'Keep the website functioning properly',
						'Remember your preferences',
						'Understand how visitors use our website',
						'Improve website performance',
						'Provide relevant marketing and advertising where applicable',
					],
				},
				{
					heading: '2. How We Use Your Information',
					paragraphs: ['We may use your information to:'],
					bullets: [
						'Process and deliver your orders',
						'Confirm orders and payments',
						'Provide customer support',
						'Process returns, refunds and replacements',
						'Communicate with you about your orders',
						'Send important service-related notifications',
						'Improve our products, website and customer experience',
						'Prevent fraudulent or unauthorized transactions',
						'Manage customer accounts',
						'Send promotional communications where permitted',
						'Conduct analytics and business operations',
						'Comply with applicable laws and legal requirements',
					],
				},
				{
					heading: '3. Payment Information',
					paragraphs: [
						'Payments may be processed through third-party payment service providers.',
						'Barelyn generally does not store your complete debit card, credit card, UPI PIN, CVV, or banking passwords on its own servers.',
						'Payment information is handled by the applicable payment service provider according to its own privacy and security practices.',
					],
				},
				{
					heading: '4. Sharing of Information',
					paragraphs: ['We may share necessary information with trusted third parties where required to provide our services, including:'],
					bullets: [
						'Delivery and logistics partners',
						'Payment gateway providers',
						'Website hosting and technology providers',
						'Customer support/service providers',
						'Marketing and analytics service providers',
						'Professional advisors',
						'Government authorities or law-enforcement agencies where legally required',
					],
				},
				{
					heading: '5. Order and Delivery Information',
					paragraphs: [
						'To successfully deliver your order, we may provide necessary information such as your name, phone number and delivery address to our logistics or delivery partners.',
					],
				},
				{
					heading: '6. Marketing Communications',
					paragraphs: [
						'If you have provided appropriate consent or where otherwise permitted by applicable law, Barelyn may contact you through email, SMS, WhatsApp, phone or other communication channels regarding:',
					],
					bullets: ['New products', 'Offers and discounts', 'Promotions', 'Product launches', 'Brand updates'],
				},
				{
					heading: '7. Data Security',
					paragraphs: [
						'We take reasonable technical and organizational measures to protect personal information against unauthorized access, misuse, alteration, disclosure or destruction.',
						'However, no internet-based system can be guaranteed to be completely secure.',
					],
				},
				{
					heading: '8. Data Retention',
					paragraphs: [
						'We retain personal information only for as long as reasonably necessary for the purposes for which it was collected, including order fulfilment, customer support, legal, tax, accounting, fraud prevention and regulatory requirements.',
						'When information is no longer required, we may securely delete or anonymize it, subject to applicable legal requirements.',
					],
				},
				{
					heading: "9. Children's Privacy",
					paragraphs: [
						"Barelyn's website and products are intended for general consumers and are not knowingly directed toward children who are not legally permitted to use the website independently.",
						'If you believe that a child has provided personal information to us without appropriate authorization, please contact us.',
					],
				},
				{
					heading: '10. Your Rights and Requests',
					paragraphs: [
						'Subject to applicable law, you may contact Barelyn regarding requests relating to your personal information, including requests for access, correction, updating, deletion or other applicable data-related rights.',
						'To make a request, contact us at:',
					],
					bullets: ['Email: customercare@barelyn.co.in', 'Phone: +91 83600-95146'],
				},
				{
					heading: '11. Third-Party Websites',
					paragraphs: [
						'Our website may contain links to third-party websites, social media platforms or other services.',
						'Barelyn is not responsible for the privacy practices or content of third-party websites. We recommend reviewing their respective privacy policies.',
					],
				},
				{
					heading: '12. Changes to this Privacy Policy',
					paragraphs: ['Barelyn may update this Privacy Policy from time to time.', 'Any updated version will be published on this page.'],
				},
				{
					heading: '13. Contact Us',
					paragraphs: ['For questions, concerns or requests regarding this Privacy Policy, please contact:'],
					bullets: [
						'Barelyn',
						'Legal Entity: Barelyn LLP',
						'Address: Basant Avenue, Ludhiana, Punjab, India, 141013',
						'Email: customercare@barelyn.co.in',
						'Phone: +91 83600-95146',
						'Grievance/Privacy Contact: Baldeep Singh/Authorised Partner',
						'Email: bsarora11@gmail.com',
					],
				},
			]}
		/>
	);
}
