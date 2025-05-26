import { Button } from "@mui/material";
import handleExportExcel from "../hooks/HandleExportExcel";



const DescargarExcelButton = ({data, campo}) => {
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
                   onClick={() => handleExportExcel(data,campo)}
              >
                   
              Exportar Excel
            </Button>
}


export default DescargarExcelButton;

