import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Disclaimer — BARELYN' };

export default function DisclaimerPage() {
	return (
		<LegalPage
			eyebrow="Legal"
			title="Product & Skincare Disclaimer"
			intro={[
				'The information provided on the Barelyn website is intended to provide general information about our cosmetic and skincare products.',
				'Please read this Disclaimer carefully before purchasing or using any Barelyn product.',
			]}
			sections={[
				{
					heading: '1. Cosmetic Products',
					paragraphs: [
						'Barelyn products are intended for cosmetic and personal-care purposes.',
						'Our products are not intended to diagnose, treat, cure or prevent any disease, medical condition or health disorder unless specifically permitted and stated under applicable law.',
					],
				},
				{
					heading: '2. Individual Results May Vary',
					paragraphs: [
						'Skincare results can vary from person to person.',
						'Factors including skin type, age, lifestyle, environment, existing skincare routine and individual sensitivity may affect results.',
						'Therefore, Barelyn does not guarantee that every customer will experience identical results.',
					],
				},
				{
					heading: '3. Product Claims',
					paragraphs: [
						'Product descriptions and claims on the Barelyn website are intended to accurately describe the intended cosmetic benefits and characteristics of our products.',
						'Barelyn does not intentionally make false or misleading claims regarding its products.',
						'Cosmetic claims should not be interpreted as medical advice or as a guarantee of a particular result. Indian cosmetic regulations prohibit false or misleading cosmetic claims.',
					],
				},
				{
					heading: '4. Patch Testing',
					paragraphs: [
						"Before using a new skincare product, customers are encouraged to perform a patch test according to the product's instructions, particularly if they have sensitive or reactive skin.",
						'If irritation, redness, burning, itching, swelling or another adverse reaction occurs, discontinue use.',
						'If symptoms are severe or persistent, seek advice from a qualified healthcare professional.',
					],
				},
				{
					heading: '5. Ingredients',
					paragraphs: [
						'Customers should carefully review the ingredient list and product instructions before use.',
						'If you have a known allergy or sensitivity to a particular ingredient, do not use a product containing that ingredient.',
						'If you are unsure whether a product is suitable for you, consult a qualified dermatologist or healthcare professional.',
					],
				},
				{
					heading: '6. Sunscreen Products',
					paragraphs: [
						'Sunscreen products should be used according to the instructions provided on the product packaging.',
						'No sunscreen should be interpreted as providing absolute or complete protection from the sun.',
						'Appropriate sun-protection practices, including reapplication as directed and limiting excessive sun exposure, should be followed.',
					],
				},
				{
					heading: '7. Pregnancy, Breastfeeding and Medical Conditions',
					paragraphs: [
						'If you are pregnant, breastfeeding, undergoing medical treatment, have a diagnosed skin condition or are using prescription skincare/medications, consult a qualified healthcare professional before introducing new skincare products.',
					],
				},
				{
					heading: '8. Product Images',
					paragraphs: [
						'We make reasonable efforts to display products and colours accurately.',
						'However, the appearance of products on different screens and devices may vary slightly.',
						'Packaging, labels or product appearance may also change from time to time in accordance with manufacturing or regulatory requirements.',
					],
				},
				{
					heading: '9. Storage and Usage',
					paragraphs: [
						'Products should be stored according to the instructions provided on the product packaging.',
						'Do not use a product beyond its stated expiry/use-before date.',
						'Keep products away from conditions that may adversely affect their quality, such as excessive heat, direct sunlight or contamination, where applicable.',
					],
				},
				{
					heading: '10. No Dermatologist-Patient Relationship',
					paragraphs: [
						'Information published on the Barelyn website, social media pages, blogs, advertisements or other communication channels does not create a dermatologist-patient, doctor-patient or other healthcare-provider relationship.',
					],
				},
				{
					heading: '11. Professional Advice',
					paragraphs: [
						"Barelyn's customer service team may provide general product information but should not be considered a substitute for professional medical or dermatological advice.",
						'For diagnosis, treatment or persistent skin concerns, consult a qualified healthcare professional.',
					],
				},
				{
					heading: '12. External Links',
					paragraphs: [
						'Barelyn may occasionally provide links to third-party websites or resources.',
						'Barelyn does not control and is not responsible for the content, accuracy, availability or privacy practices of third-party websites.',
					],
				},
				{
					heading: '13. Changes to this Disclaimer',
					paragraphs: [
						'Barelyn may update this Disclaimer from time to time.',
						'The updated version will be published on this page with the revised effective date.',
					],
				},
				{
					heading: '14. Contact Us',
					paragraphs: ['If you have questions regarding a Barelyn product, please contact:'],
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
