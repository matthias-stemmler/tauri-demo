/// Custom error type that is serializable
use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Error {
    message: String,
}

impl Error {
    pub(crate) fn new(message: String) -> Error {
        Error { message }
    }
}

impl<E> From<E> for Error
where
    E: std::error::Error,
{
    fn from(err: E) -> Error {
        Error {
            message: err.to_string(),
        }
    }
}
