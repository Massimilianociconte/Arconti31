// Netlify Function per gestire OAuth callback
// Questo file è opzionale - il CMS usa principalmente Netlify Identity

exports.handler = async (event, context) => {
  // Se usi Netlify Identity, questa funzione non è necessaria
  // È qui come fallback per autenticazione GitHub diretta
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Use Netlify Identity for authentication' })
  };
};
