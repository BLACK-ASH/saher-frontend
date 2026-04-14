import { resume } from "react-dom/server";
import { z } from "zod";

// 🔹 Common ObjectId validator
const objectId = z
  .string()
  .min(1, "Required")
  .regex(/^[a-f\d]{24}$/i, "Invalid ID format");

// Bank Schema
export const bankDetailSchema = z.object({
  accountHolderName: z.string().min(2, "Account holder name is required"),
  bankName: z.string().min(2, "Bank name is required"),
  branch: z.string().min(2, "Branch is required"),
  ifcs: z
    .string()
    .regex(/^[A-Za-z]{4}\d{7}$/, "Invalid IFSC code"),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
});

// 🔹 User Schema
export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  displayName: z.string().optional(),
  email: z.email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  image: objectId.refine((val) => val !== "", {
    message: "Profile image is required",
  }),
});

// 🔹 Account Schema
export const accountSchema = z.object({
  user: z.string().optional(),

  employeeId: z.string().min(1, "Employee ID is required"),

  gender: z.enum(["male", "female", "other"], {
    message: "Gender is required",
  }),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required"),

  dateOfJoining: z
    .string()
    .min(1, "Date of joining is required"),

  employeeType: z
    .string()
    .min(1, "Employee type is required"),

  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number"),

  secondaryPhoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid secondary phone number")
    .optional(),

  address: z.string().min(5, "Address is required"),

  department: z.string().min(1, "Department is required"),

  designation: z.string().min(1, "Designation is required"),

  salaryStructure: z.string().min(1, "Salary structure is required"),

  // 🔥 ObjectId fields
  bankDetail: z.string().optional(),

  aadhar: objectId.refine((val) => val !== "", {
    message: "Aadhar document is required",
  }),

  pan: objectId.refine((val) => val !== "", {
    message: "PAN document is required",
  }),

  resume: objectId.refine((val) => val !== "", {
    message: "Resume is required",
  }),
});

const uploaded = z.object({
  image: z.string(),
  aadhar: z.string(),
  pan: z.string(),
  resume: z.string(),
})

// 🔹 Final Schema
export const registerFormSchema = z.object({
  user: userSchema,
  bank: bankDetailSchema,
  account: accountSchema,
  uploaded: uploaded.optional()
});

// 🔹 Type
export type RegisterFormData = z.infer<typeof registerFormSchema>;
