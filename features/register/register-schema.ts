import { z } from "zod";

// 🔹 Common ObjectId validator
const objectId = z
  .string()
  .min(1, "Required")
  .regex(/^[a-f\d]{24}$/i, "Invalid ID format");

// Bank Schema
export const bankDetailSchema = z.object({
  accountHolderName: z.string().min(2, "Account Holder Name Is Required"),
  bankName: z.string().min(2, "Bank Name Is Required."),
  accountNumber: z.string("Bank Account Number Is Required."),
  ifcs: z
    .string("Bank IFCS Code Is Required.")
    .trim()
    .regex(/^[a-zA-Z]{4}0[a-zA-Z0-9]{6}$/, {
      message: "Invalid IFCS Code According To Indian Banks.",
    })
    .transform((val) => val.toUpperCase()),
  branch: z.string().min(2, "Branch Name Is Required."),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/, {
      message: "Invalid Indian mobile number",
    })
    .transform((val) => val.replace(/^\+91[\s-]?|^91[\s-]?/, "")),
});

// 🔹 User Schema
export const userSchema = z
  .object({
    name: z
      .string("Username Is Required.")
      .trim()
      .min(2, "User Name Is Required"),
    displayName: z.string().optional(),
    image: objectId,
    role: z.enum(["user", "manager", "admin", "intern"]),
    email: z.email("Email Address Is Required."),
  })
  .refine((data) => /^[a-zA-Z]/.test(data.name) && !/[_-]$/.test(data.name), {
    message: "Name must start with a letter and cannot end with _ or -",
    path: ["name"],
  });

// 🔹 Account Schema
const accountSchema = z
  .object({
    gender: z.enum(["male", "female", "other"]),
    dateOfBirth: z.string().min(2, "Date Of Birth Is Required."),
    dateOfJoining: z.string().min(2, "Date Of Joining Is Required."),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/, {
        message: "Invalid Indian Mobile Number",
      }),
    secondaryPhoneNumber: z
      .string()
      .trim()
      .regex(/^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/, {
        message: "Invalid Indian Mobile Number",
      })
      .optional(),
    employeeId: z.string().min(2, "Date Of Birth Is Required."),
    department: z.string().min(2, "Date Of Birth Is Required."),
    designation: z.string().min(2, "Date Of Birth Is Required."),
    employeeType: z.enum(
      ["full-time", "part-time", "volunteer"],
      "Employee Type Is Required.",
    ),
    employeeShift: z.enum(["shift-1", "shift-2"]).optional(),
    salaryStructure: z.string().min(2, "Date Of Birth Is Required."),
    address: z.string().min(2, "Date Of Birth Is Required."),
    bank: z.string().optional(),
    aadhar: objectId,
    pan: objectId,
    resume: objectId,
  })
  .refine(
    (data) => {
      if (data.employeeType === "part-time") {
        return !!data.employeeShift;
      }
      return true;
    },
    {
      message: "Employee Shift Is Required For Part Time Employee.",
      path: ["employeeShift"],
    },
  );

const uploaded = z.object({
  image: z.string(),
  aadhar: z.string(),
  pan: z.string(),
  resume: z.string(),
});

// 🔹 Final Schema
export const registerFormSchema = z.object({
  user: userSchema,
  bank: bankDetailSchema,
  account: accountSchema,
  uploaded: uploaded.optional(),
});

// 🔹 Type
export type RegisterFormData = z.infer<typeof registerFormSchema>;
