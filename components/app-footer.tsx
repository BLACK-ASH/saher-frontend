type Props = {};

export default function Footer({}: Props) {
  return (
    <footer className="mt-auto border-t bg-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-4 text-sm md:flex-row">
        <div>
          <p className="font-medium">SAHER Internals</p>
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Society for Awareness, Harmony and
            Equal Rights.
          </p>
        </div>

        <div className="text-center md:text-right">
          <p className="text-muted-foreground">Designed & Developed by</p>
          <p className="font-semibold">CatLium</p>
        </div>
      </div>
    </footer>
  );
}
