import {defineField, defineType} from 'sanity'

const hourOptions = Array.from({length: 24}, (_, index) => ({
  title: `${index + 1} ${index === 0 ? 'hour' : 'hours'}`,
  value: index + 1,
}))

export default defineType({
  name: 'stitchingRequest',
  title: 'Stitching Request',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Request',
      description: 'A short description, such as “Blue kurta alterations”.',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'customer',
      title: 'Customer',
      type: 'reference',
      to: [{type: 'contact'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'clothPhoto',
      title: 'Cloth Photo',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'requestDate',
      title: 'Request Date',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'expectedDeliveryDate',
      title: 'Expected Delivery Date',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'timeRequiredHours',
      title: 'Time Required',
      description: 'Estimated work time in whole hours.',
      type: 'number',
      options: {list: hourOptions},
      validation: (rule) => rule.required().min(1).max(24),
    }),
    defineField({
      name: 'comments',
      title: 'Extra Comments',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Received', value: 'received'},
          {title: 'In progress', value: 'inProgress'},
          {title: 'Ready for pickup', value: 'ready'},
          {title: 'Delivered', value: 'delivered'},
          {title: 'Cancelled', value: 'cancelled'},
        ],
      },
      initialValue: 'received',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'deliveredAt',
      title: 'Delivered At',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      customer: 'customer.name',
      deliveryDate: 'expectedDeliveryDate',
      status: 'status',
    },
    prepare({title, customer, deliveryDate, status}) {
      const details = [customer, deliveryDate, status].filter(Boolean).join(' · ')
      return {title, subtitle: details}
    },
  },
})
