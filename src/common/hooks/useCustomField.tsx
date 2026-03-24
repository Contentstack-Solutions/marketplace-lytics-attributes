import { useContext } from "react";
import { CustomFieldExtensionContext, CustomFieldExtensionContextType } from "../contexts/customFieldExtensionContext";

export const useCustomField = () => {
  const { customField, setFieldData, loading } = useContext(
    CustomFieldExtensionContext
  ) as CustomFieldExtensionContextType;

  return { customField, setFieldData, loading };
};
