import type {
  InvoiceProps,
  LineItem,
  ShippingAddress,
  CustomerInfo,
  PaymentInfo,
} from "@/components/prebuilt/invoice";
import { faker } from "@faker-js/faker";
import { z } from "zod";

export const invoiceSchema = z.object({
  orderId: z.string().describe("The order ID"),
});

export function getInvoiceData(
  input: z.infer<typeof invoiceSchema>,
): InvoiceProps {
  const lineItems: LineItem[] = Array.from({ length: 3 }, (_, i) => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 5 }),
    price: faker.number.float({ min: 25, max: 250 }),
  }));
  const fullCustomerName = faker.person.fullName();
  const shippingAddress: ShippingAddress = {
    name: fullCustomerName,
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zip: faker.location.zipCode(),
  };
  const customerInfo: CustomerInfo = {
    name: fullCustomerName,
    email: faker.internet.email(),
    phone: faker.phone.number(),
  };
  const paymentInfo: PaymentInfo = {
    cardType: faker.helpers.arrayElement(["Visa", "Mastercard", "AMEX"]),
    cardNumberLastFour: faker.number.int({ min: 1000, max: 9999 }).toString(),
  };
  return {
    orderId: input.orderId,
    lineItems,
    shippingAddress,
    customerInfo,
    paymentInfo,
  };
}
