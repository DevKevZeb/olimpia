import { Button } from "@mui/material";
import handleExportExcel, { FilaReporteExcel } from "../hooks/HandleExportExcel";



interface DescargarExcelButtonProps {
    data: FilaReporteExcel[] | null;
    campo: string;
}

const DescargarExcelButton = ({data, campo}: DescargarExcelButtonProps) => {
 return   <Button
                   variant="contained"
                    sx={{
                        mt: 2,
                        backgroundColor: 'green',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'darkgreen',
                        },
                        marginLeft:'16px'
                      }}
                   disabled={!data || data.length === 0}
                   onClick={() => data && handleExportExcel(data,campo)}
              >
                   
              Exportar Excel
            </Button>
}


export default DescargarExcelButton;

