'use client';

import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';

export default function PricingSection() {
  const tiers = [
    {
      name: 'Basic',
      id: 'tier-basic',
      price: {
        monthly: '$0',
        annually: '$0',
      },
      description: 'Everything you need to get started with secure email.',
      features: [
        '5 disposable email addresses',
        '1GB storage',
        'Basic encryption features',
        'Integration with SecureMailClient',
        'Community support',
      ],
      cta: 'Start for free',
      mostPopular: false,
    },
    {
      name: 'Premium',
      id: 'tier-premium',
      price: {
        monthly: '$4.99',
        annually: '$49.99',
      },
      description: 'Ideal for privacy-conscious individuals with advanced needs.',
      features: [
        'Unlimited disposable email addresses',
        '15GB storage',
        'Advanced encryption features',
        'Encrypted key backup service',
        'Priority message routing',
        'Extended address lifetime options',
        'Priority support',
      ],
      cta: 'Get Premium',
      mostPopular: true,
    },
    {
      name: 'Enterprise',
      id: 'tier-enterprise',
      price: {
        monthly: 'Custom',
        annually: 'Custom',
      },
      description: 'For organizations requiring enhanced security and compliance.',
      features: [
        'Custom domain support',
        'Unlimited storage',
        'Enterprise-grade encryption',
        'Admin console & user management',
        'SSO integration',
        'Compliance features & reporting',
        'Dedicated account manager',
        '24/7 priority support',
      ],
      cta: 'Contact Sales',
      mostPopular: false,
    },
  ];

  return (
    <motion.div
      id="pricing"
      className="py-24 sm:py-32"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Pricing</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Simple, transparent pricing
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Choose the plan that's right for your privacy needs. All plans include our core security features.
          </p>
        </div>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl xl:mx-0 xl:max-w-none xl:grid-cols-3">
          {tiers.map((tier, tierIdx) => (
            <motion.div
              key={tier.id}
              className={`${tier.mostPopular ? 'ring-2 ring-primary-600' : 'ring-1 ring-gray-200 dark:ring-gray-800'} rounded-3xl p-8 shadow-sm bg-white dark:bg-gray-900`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: tierIdx * 0.1 }}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3 className="text-lg font-semibold leading-8 text-gray-900 dark:text-white">{tier.name}</h3>
                {tier.mostPopular ? (
                  <p className="rounded-full bg-primary-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-primary-600">
                    Most popular
                  </p>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{tier.price.monthly}</span>
                <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">
                  {tier.price.monthly !== 'Custom' ? '/month' : ''}
                </span>
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                {tier.price.annually !== 'Custom' ? `${tier.price.annually} billed annually` : ''}
              </p>
              <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-primary-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.name === 'Enterprise' ? '/contact' : '/signup'}
                className={`${tier.mostPopular ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-500 focus-visible:outline-primary-600' : 'text-primary-600 ring-1 ring-inset ring-primary-200 hover:ring-primary-300 dark:ring-primary-800 dark:hover:ring-primary-700'} mt-8 block rounded-md py-2.5 px-3.5 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mx-auto mt-16 max-w-7xl rounded-3xl bg-primary-100 dark:bg-primary-900/40 p-8 sm:p-10"  
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Still have questions?</h3>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                Contact our team to learn more about enterprise options or get answers to your questions.
              </p>
            </div>
            <Link
              href="/contact"
              className="mt-6 md:mt-0 inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Contact sales
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}